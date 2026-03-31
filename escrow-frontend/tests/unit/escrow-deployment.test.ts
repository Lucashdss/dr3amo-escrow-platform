import {
  encodeAbiParameters,
  encodeEventTopics,
  type Log,
} from "viem";

import {
  extractEscrowAddressFromLogs,
  extractEscrowCreatedLogArgs,
} from "@/features/escrows/services/escrowLogDecoder";

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

const indexedEscrowCreatedEvent = {
  ...escrowCreatedEvent,
  inputs: [
    { indexed: true, name: "escrow", type: "address" },
    { indexed: true, name: "client", type: "address" },
    { indexed: true, name: "freelancer", type: "address" },
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

  it("decodes escrow args from the indexed factory event variant", () => {
    const escrowAddress = "0x0000000000000000000000000000000000000099";
    const clientAddress = "0x0000000000000000000000000000000000000001";
    const freelancerAddress = "0x0000000000000000000000000000000000000002";
    const tokenAddress = "0x0000000000000000000000000000000000000003";
    const dataFeedAddress = "0x0000000000000000000000000000000000000004";
    const log = {
      data: encodeAbiParameters(
        [
          { type: "address" },
          { type: "uint256" },
          { type: "address" },
          { type: "uint256" },
        ],
        [
          tokenAddress,
          BigInt(5),
          dataFeedAddress,
          BigInt(2000),
        ]
      ),
      topics: encodeEventTopics({
        abi: [indexedEscrowCreatedEvent],
        args: {
          client: clientAddress,
          escrow: escrowAddress,
          freelancer: freelancerAddress,
        },
        eventName: "EscrowCreated",
      }),
    } as Log;

    expect(extractEscrowCreatedLogArgs([log])).toEqual({
      bps: BigInt(2000),
      client: clientAddress,
      dataFeed: dataFeedAddress,
      deliveryPeriod: BigInt(5),
      escrow: escrowAddress,
      freelancer: freelancerAddress,
      token: tokenAddress,
    });
  });
});
