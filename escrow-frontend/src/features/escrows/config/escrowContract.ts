import type {
  EscrowActionAvailability,
  EscrowActionKey,
  EscrowLiveState,
} from "@/features/escrows/types/escrow";

export const ESCROW_ABI = [
  {
    type: "function",
    name: "cancelEscrow",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "confirmDelivery",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fund",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getAmountToRelease",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDeadline",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEscrowState",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum EscrowFreelance.EscrowState",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMinimumPriceUSD",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getModificationsRequested",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "initiateDispute",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "markWorkSubmitted",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestModificationAndUpdateDeadline",
    inputs: [
      {
        name: "deadlineExtension",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMinimumPriceUSD",
    inputs: [{ name: "usdAmount", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "DeliveryConfirmed",
    inputs: [
      {
        name: "client",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "DisputeInitiated",
    inputs: [
      {
        name: "initiator",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsRefunded",
    inputs: [
      {
        name: "client",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      {
        name: "freelancer",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MinimumPriceUpdated",
    inputs: [
      {
        name: "newMinimumPrice",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "StateChanged",
    inputs: [
      {
        name: "newState",
        type: "uint8",
        indexed: false,
        internalType: "enum EscrowFreelance.EscrowState",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "UpfrontPaymentSent",
    inputs: [
      {
        name: "bps",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "amountSent",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

const ESCROW_ACTION_DEFINITIONS: Record<
  EscrowActionKey,
  Omit<EscrowActionAvailability, "disabled" | "disabledReason">
> = {
  cancelEscrow: {
    description: "Cancel the escrow while it is still in the created state.",
    inputKind: "none",
    key: "cancelEscrow",
    label: "Cancel Escrow",
  },
  confirmDelivery: {
    description: "Confirm the submitted work and release the contract flow.",
    inputKind: "none",
    key: "confirmDelivery",
    label: "Confirm Delivery",
  },
  fund: {
    description: "Fund the escrow from the client wallet.",
    inputKind: "amount",
    key: "fund",
    label: "Fund",
  },
  initiateDispute: {
    description: "Escalate the contract into dispute resolution.",
    inputKind: "none",
    key: "initiateDispute",
    label: "Initiate Dispute",
  },
  markWorkSubmitted: {
    description: "Mark the seller work as submitted for buyer review.",
    inputKind: "none",
    key: "markWorkSubmitted",
    label: "Mark Work Submitted",
  },
  requestModificationAndUpdateDeadline: {
    description: "Request a modification and extend the deadline in whole days.",
    inputKind: "days",
    key: "requestModificationAndUpdateDeadline",
    label: "Request Modification",
  },
  setMinimumPriceUSD: {
    description: "Set the minimum accepted price before the contract is funded.",
    inputKind: "usd",
    key: "setMinimumPriceUSD",
    label: "Set Minimum Price",
  },
};

export const ESCROW_ROLE_ACTIONS = {
  client: [
    "cancelEscrow",
    "fund",
    "confirmDelivery",
    "requestModificationAndUpdateDeadline",
    "initiateDispute",
  ],
  freelancer: [
    "setMinimumPriceUSD",
    "markWorkSubmitted",
    "initiateDispute",
  ],
} as const;

export const ESCROW_TERMINAL_STATES = [
  "released",
  "refunded",
  "dispute",
  "canceled",
] as const;

const ESCROW_STATE_INDEX: Record<number, EscrowLiveState> = {
  0: "created",
  1: "funded",
  2: "work submitted",
  3: "pending modification",
  4: "released",
  5: "refunded",
  6: "dispute",
  7: "canceled",
};

export function getEscrowActionDefinition(
  actionKey: EscrowActionKey
): Omit<EscrowActionAvailability, "disabled" | "disabledReason"> {
  return ESCROW_ACTION_DEFINITIONS[actionKey];
}

export function getEscrowLiveStateFromIndex(
  stateIndex: number
): EscrowLiveState | null {
  return ESCROW_STATE_INDEX[stateIndex] ?? null;
}
