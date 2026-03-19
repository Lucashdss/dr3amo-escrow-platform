import {
  encodeAbiParameters,
  encodeEventTopics,
  type Log,
} from "viem";

import { extractEscrowAddressFromLogs } from "@/features/escrows/services/escrowLogDecoder";

const escrowCreatedEvent = {
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
} as const;

describe("extractEscrowAddressFromLogs", () => {
  it("returns null when no escrow event is present", () => {
    expect(extractEscrowAddressFromLogs([])).toBeNull();
  });

  it("extracts the escrow address from a factory event log", () => {
    const escrowAddress = "0x0000000000000000000000000000000000000099";
    const log = {
      data: encodeAbiParameters(
        [
          { type: "address" },
          { type: "address" },
          { type: "address" },
          { type: "address" },
          { type: "uint256" },
          { type: "address" },
          { type: "uint256" },
        ],
        [
          escrowAddress,
          "0x0000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000002",
          "0x0000000000000000000000000000000000000003",
          BigInt(5),
          "0x0000000000000000000000000000000000000004",
          BigInt(2000),
        ]
      ),
      topics: encodeEventTopics({
        abi: [escrowCreatedEvent],
        eventName: "EscrowCreated",
      }),
    } as Log;

    expect(extractEscrowAddressFromLogs([log])).toBe(escrowAddress);
  });
});
