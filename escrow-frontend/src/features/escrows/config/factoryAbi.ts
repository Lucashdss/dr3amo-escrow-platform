export const FACTORY_ABI = [
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "freelancer", type: "address" },
      { name: "deliveryPeriod", type: "uint256" },
      { name: "dataFeed", type: "address" },
      { name: "token", type: "address" },
      { name: "admin", type: "address" },
      { name: "bps", type: "uint256" },
    ],
    outputs: [{ name: "escrow", type: "address" }],
  },
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
] as const;
