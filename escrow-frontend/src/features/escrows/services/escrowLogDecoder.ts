import {
  decodeEventLog,
  getAddress,
  isAddress,
  type Address,
  type Log,
} from "viem";

const ESCROW_CREATED_EVENT_ABI_VARIANTS = [
  [
    {
      type: "event",
      name: "EscrowCreated",
      anonymous: false,
      inputs: [
        { indexed: false, name: "escrow", type: "address" },
        { indexed: false, name: "client", type: "address" },
        { indexed: false, name: "freelancer", type: "address" },
        { indexed: false, name: "token", type: "address" },
        { indexed: false, name: "deliveryPeriod", type: "uint256" },
        { indexed: false, name: "dataFeed", type: "address" },
        { indexed: false, name: "bps", type: "uint256" },
      ],
    },
  ],
  [
    {
      type: "event",
      name: "EscrowCreated",
      anonymous: false,
      inputs: [
        { indexed: true, name: "escrow", type: "address" },
        { indexed: true, name: "client", type: "address" },
        { indexed: true, name: "freelancer", type: "address" },
        { indexed: false, name: "token", type: "address" },
        { indexed: false, name: "deliveryPeriod", type: "uint256" },
        { indexed: false, name: "dataFeed", type: "address" },
        { indexed: false, name: "bps", type: "uint256" },
      ],
    },
  ],
] as const;

export function extractEscrowAddressFromLogs(logs: readonly Log[]): Address | null {
  for (const log of logs) {
    for (const abi of ESCROW_CREATED_EVENT_ABI_VARIANTS) {
      try {
        const decodedLog = decodeEventLog({
          abi,
          data: log.data,
          eventName: "EscrowCreated",
          strict: false,
          topics: log.topics,
        });
        const escrowAddress = decodedLog.args?.escrow;

        if (typeof escrowAddress === "string" && isAddress(escrowAddress)) {
          return getAddress(escrowAddress);
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}
