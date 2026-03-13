export const FACTORY_ADDRESS = "0x06eAf7800Fd0c20D54dcb8D21FB87516Bbce2BF4";

export const FACTORY_ABI = [
    {
        name: "createEscrow",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "freelancer", type: "address" },
            { name: "amount", type: "uint256" }
        ],
        outputs: [{ type: "address" }]
    }
];