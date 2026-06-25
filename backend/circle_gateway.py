"""Circle Gateway EIP-3009 authorization for gas-free x402 nanopayments."""

import base64
import json
import os
import secrets
import time
from typing import Optional

from eth_account import Account
from eth_account.messages import encode_typed_data


def generate_eip3009_auth(to_address: str, amount_usdc: float) -> str:
    """
    Generate an EIP-3009 TransferWithAuthorization signature for Circle Gateway.

    Args:
        to_address: The recipient address for USDC transfer.
        amount_usdc: Amount of USDC to authorize (will be converted to micro-units).

    Returns:
        Base64-encoded JSON payload suitable for X-Circle-Gateway-Auth header.

    Raises:
        ValueError: If required environment variables are missing or invalid.
    """
    private_key = os.getenv("AGENT_PRIVATE_KEY")
    if not private_key:
        raise ValueError("AGENT_PRIVATE_KEY environment variable is not set")

    from_address = os.getenv("AGENT_WALLET_ADDRESS")
    if not from_address:
        raise ValueError("AGENT_WALLET_ADDRESS environment variable is not set")

    verifying_contract = os.getenv(
        "GATEWAY_VERIFYING_CONTRACT",
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"  # Default USDC contract
    )

    # Convert USDC amount to micro-units (6 decimals)
    value = int(amount_usdc * 1_000_000)

    now = int(time.time())
    valid_after = now - 600  # 10 minutes ago
    valid_before = now + 604800  # 7 days from now

    # Generate random 32-byte nonce
    nonce = "0x" + secrets.token_hex(32)

    # EIP-712 domain separator
    domain_data = {
        "name": "GatewayWalletBatched",
        "version": "1",
        "chainId": 5042002,  # Arc Testnet
        "verifyingContract": verifying_contract,
    }

    # EIP-712 message types
    message_types = {
        "TransferWithAuthorization": [
            {"name": "from", "type": "address"},
            {"name": "to", "type": "address"},
            {"name": "value", "type": "uint256"},
            {"name": "validAfter", "type": "uint256"},
            {"name": "validBefore", "type": "uint256"},
            {"name": "nonce", "type": "bytes32"},
        ]
    }

    # EIP-712 message data
    message_data = {
        "from": from_address,
        "to": to_address,
        "value": value,
        "validAfter": valid_after,
        "validBefore": valid_before,
        "nonce": nonce,
    }

    try:
        # Encode the typed data according to EIP-712
        signable_message = encode_typed_data(
            domain_data,
            message_types,
            message_data,
        )

        # Sign with the agent's private key
        account = Account.from_key(private_key)
        signed = account.sign_message(signable_message)

        # Build the authorization payload
        payload = {
            "signature": signed.signature.hex(),
            "message": {
                "from": from_address,
                "to": to_address,
                "value": str(value),
                "validAfter": valid_after,
                "validBefore": valid_before,
                "nonce": nonce,
            },
            "domain": domain_data,
            "primaryType": "TransferWithAuthorization",
            "types": {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "version", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"},
                ],
                **message_types,
            },
        }

        # Base64 encode the JSON payload
        payload_json = json.dumps(payload, separators=(",", ":"))
        encoded = base64.b64encode(payload_json.encode("utf-8")).decode("utf-8")
        return encoded

    except Exception as e:
        raise ValueError(f"Failed to generate EIP-3009 authorization: {str(e)}")
