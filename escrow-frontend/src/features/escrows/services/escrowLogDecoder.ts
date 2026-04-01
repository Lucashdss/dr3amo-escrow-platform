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

export type EscrowCreatedLogArgs = {
  bps: bigint;
  client: Address;
  dataFeed: Address;
  deliveryPeriod: bigint;
  escrow: Address;
  freelancer: Address;
  token: Address;
};

function parseAddress(value: unknown): Address | null {
  const address =
    typeof value === "string" && isAddress(value) ? getAddress(value) : null;

  return address;
}

function parseBigIntValue(value: unknown): bigint | null {
  let bigintValue: bigint | null = null;

  if (typeof value === "bigint") {
    bigintValue = value;
  } else if (typeof value === "number") {
    bigintValue = BigInt(value);
  }

  return bigintValue;
}

function parseEscrowCreatedLogArgs(
  args: Record<string, unknown> | undefined
): EscrowCreatedLogArgs | null {
  const escrow = parseAddress(args?.escrow);
  const client = parseAddress(args?.client);
  const freelancer = parseAddress(args?.freelancer);
  const token = parseAddress(args?.token);
  const dataFeed = parseAddress(args?.dataFeed);
  const deliveryPeriod = parseBigIntValue(args?.deliveryPeriod);
  const bps = parseBigIntValue(args?.bps);
  const hasRequiredValues =
    escrow &&
    client &&
    freelancer &&
    token &&
    dataFeed &&
    deliveryPeriod !== null &&
    bps !== null;

  return hasRequiredValues
    ? { bps, client, dataFeed, deliveryPeriod, escrow, freelancer, token }
    : null;
}

function decodeEscrowCreatedLog(log: Log): EscrowCreatedLogArgs | null {
  let decodedArgs: EscrowCreatedLogArgs | null = null;

  for (const abi of ESCROW_CREATED_EVENT_ABI_VARIANTS) {
    try {
      const decodedLog = decodeEventLog({
        abi,
        data: log.data,
        eventName: "EscrowCreated",
        strict: false,
        topics: log.topics,
      });

      decodedArgs = parseEscrowCreatedLogArgs(
        decodedLog.args as Record<string, unknown> | undefined
      );
    } catch {
      decodedArgs = null;
    }

    if (decodedArgs) {
      break;
    }
  }

  return decodedArgs;
}

export function extractEscrowCreatedLogArgs(
  logs: readonly Log[]
): EscrowCreatedLogArgs | null {
  let decodedArgs: EscrowCreatedLogArgs | null = null;

  for (const log of logs) {
    decodedArgs = decodeEscrowCreatedLog(log);

    if (decodedArgs) {
      break;
    }
  }

  return decodedArgs;
}

export function extractEscrowAddressFromLogs(logs: readonly Log[]): Address | null {
  const decodedArgs = extractEscrowCreatedLogArgs(logs);

  return decodedArgs?.escrow ?? null;
}
