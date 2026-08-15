// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ArcVault
 * @notice Vault contract for Circle's Arc chain.
 *
 * @dev IMPORTANT: On Arc, USDC exists as ONE asset viewable two ways:
 *      - Native view: 18 decimals (used for msg.value / gas-style transfers)
 *      - ERC-20 view:  6 decimals (used for transferFrom/approve/allowance)
 *      These are NOT two different tokens and must never be tracked as
 *      separate balances or separate totals — doing so double-counts vault
 *      holdings and can under-collateralize withdrawals. This contract
 *      normalizes everything to the 6-decimal ERC-20 view internally,
 *      converting native (18-decimal) amounts on the way in/out.
 *      Conversion factor: 1 ERC-20 unit (6dp) = 10^12 native units (18dp).
 *
 * @dev THIS CONTRACT HAS NOT BEEN AUDITED. Review thoroughly before mainnet deployment.
 */
/* UNAUDITED CONTRACT - FOR DEMO / ARC TESTNET USE ONLY */
contract ArcVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Conversion factor between native (18dp) and ERC-20 (6dp) views of USDC.
    uint256 private constant DECIMALS_SCALE = 1e12;

    // Arc ERC-20 USDC token (6 decimals) — same underlying asset as native USDC.
    IERC20 public immutable usdcToken;

    // Single source of truth for vault holdings, always in 6-decimal (ERC-20) units.
    uint256 public totalUsdcDeposited;

    // Single balance per user, always in 6-decimal (ERC-20) units.
    mapping(address => uint256) public usdcBalances;

    event UsdcDeposited(address indexed sender, uint256 amount6dp, bool viaNative);
    event UsdcWithdrawn(address indexed recipient, uint256 amount6dp, bool viaNative);

    /**
     * @param _usdcAddress Address of the Arc ERC-20 USDC contract
     *        (0x3600000000000000000000000000000000000000 on Arc Testnet — verify
     *        against Circle's current docs before deploying, addresses can change).
     */
    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "ArcVault: Invalid token address");
        usdcToken = IERC20(_usdcAddress);
    }

    /**
     * @notice Deposit USDC via its native (18-decimal) interface, i.e. msg.value.
     *         Internally converted and tracked in the same 6-decimal balance as
     *         ERC-20 deposits, since it's the same underlying asset.
     */
    function depositNative() external payable whenNotPaused nonReentrant {
        require(msg.value > 0, "ArcVault: Amount must be > 0");
        require(msg.value % DECIMALS_SCALE == 0, "ArcVault: Amount has non-zero dust below 6dp precision");

        uint256 amount6dp = msg.value / DECIMALS_SCALE;

        usdcBalances[msg.sender] += amount6dp;
        totalUsdcDeposited += amount6dp;

        emit UsdcDeposited(msg.sender, amount6dp, true);
    }

    /**
     * @notice Deposit USDC via its ERC-20 (6-decimal) interface.
     * @param amount6dp Amount to deposit in micro-USDC (6 decimals).
     */
    function depositErc20(uint256 amount6dp) external whenNotPaused nonReentrant {
        require(amount6dp > 0, "ArcVault: Amount must be > 0");

        usdcBalances[msg.sender] += amount6dp;
        totalUsdcDeposited += amount6dp;

        // safeTransferFrom reverts on insufficient balance/allowance, so no
        // need for separate balanceOf/allowance checks beforehand.
        usdcToken.safeTransferFrom(msg.sender, address(this), amount6dp);

        emit UsdcDeposited(msg.sender, amount6dp, false);
    }

    /**
     * @notice Withdraw USDC via the native (18-decimal) interface.
     * @param amount6dp Amount to withdraw, expressed in 6-decimal units
     *        (converted to native units internally for the transfer).
     */
    function withdrawNative(uint256 amount6dp) external whenNotPaused nonReentrant {
        require(amount6dp > 0, "ArcVault: Amount must be > 0");
        require(usdcBalances[msg.sender] >= amount6dp, "ArcVault: Insufficient balance");

        usdcBalances[msg.sender] -= amount6dp;
        totalUsdcDeposited -= amount6dp;

        uint256 amountNative = amount6dp * DECIMALS_SCALE;
        (bool success, ) = payable(msg.sender).call{value: amountNative}("");
        require(success, "ArcVault: Native transfer failed");

        emit UsdcWithdrawn(msg.sender, amount6dp, true);
    }

    /**
     * @notice Withdraw USDC via the ERC-20 (6-decimal) interface.
     * @param amount6dp Amount to withdraw in micro-USDC (6 decimals).
     */
    function withdrawErc20(uint256 amount6dp) external whenNotPaused nonReentrant {
        require(amount6dp > 0, "ArcVault: Amount must be > 0");
        require(usdcBalances[msg.sender] >= amount6dp, "ArcVault: Insufficient balance");

        usdcBalances[msg.sender] -= amount6dp;
        totalUsdcDeposited -= amount6dp;

        usdcToken.safeTransfer(msg.sender, amount6dp);

        emit UsdcWithdrawn(msg.sender, amount6dp, false);
    }

    /**
     * @notice Admin-only pause/unpause for emergency stop.
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
