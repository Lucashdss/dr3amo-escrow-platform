export type LandingDocumentLink = Readonly<{
  href: string;
  icon: "linkedin";
  label: string;
}>;

export type LandingDocumentSection = Readonly<{
  items?: readonly string[];
  links?: readonly LandingDocumentLink[];
  paragraphs?: readonly string[];
  title: string;
}>;

export type LandingDocumentContent = Readonly<{
  description: string;
  introParagraphs: readonly string[];
  sections: readonly LandingDocumentSection[];
  title: string;
  updatedAtLabel: string;
}>;

export const ABOUT_DR3AMO_CONTENT: LandingDocumentContent = {
  title: "About Dr3amo",
  updatedAtLabel: "Updated 13/04/2026",
  description: "Overview of Dr3amo and the escrow experience it is building.",
  introParagraphs: [
    "Dr3amo is a decentralized escrow protocol designed to make online agreements secure, transparent, and trustless.",
    "It enables clients and freelancers to transact with confidence by locking funds in smart contracts that execute automatically based on predefined conditions.",
  ],
  sections: [
    {
      title: "The Problem",
      paragraphs: [
        "Digital work relies heavily on trust between parties who often have no prior relationship.",
        "This creates friction and risk:",
      ],
      items: [
        "Freelancers may not get paid after delivering work",
        "Clients may receive incomplete or unsatisfactory results",
        "Disputes are slow, subjective, and costly",
      ],
    },
    {
      title: "The Solution",
      paragraphs: ["Dr3amo replaces trust with code.", "By leveraging blockchain technology, escrow agreements become:"],
      items: [
        "Secure - funds are locked on-chain",
        "Transparent - all transactions are verifiable",
        "Trustless - no intermediary required",
      ],
    },
    {
      title: "How It Works",
      items: [
        "A client creates an escrow agreement",
        "Funds are deposited into a smart contract",
        "The freelancer completes the work",
        "Funds are released or refunded based on contract conditions",
      ],
    },
    {
      title: "Why Dr3amo",
      items: [
        "Non-custodial architecture",
        "Reduced fees compared to traditional platforms",
        "Open and verifiable smart contracts",
        "Global and permissionless access",
      ],
    },
    {
      title: "Vision",
      paragraphs: [
        "We believe the future of agreements is programmable, borderless, and trustless.",
        "Dr3amo aims to become foundational infrastructure for secure value exchange on the internet.",
      ],
    },
    {
      title: "Founder",
      paragraphs: [
        "Dr3amo is created and maintained by Lucas Santos, a software developer focused on building secure and scalable web and blockchain applications.",
      ],
      links: [
        {
          href: "https://www.linkedin.com/in/lucas-st",
          icon: "linkedin",
          label: "linkedin",
        },
      ],
    },
  ],
};

export const PRIVACY_POLICY_CONTENT: LandingDocumentContent = {
  title: "Privacy Policy",
  updatedAtLabel: "Updated 15/04/2026",
  description: "Privacy Policy for Dr3amo.",
  introParagraphs: [
    "Dr3amo (\"we\", \"our\", or \"us\") is committed to protecting your privacy and handling your data transparently in accordance with applicable laws, including the General Data Protection Regulation (GDPR).",
  ],
  sections: [
    {
      title: "1. Information We Collect",
      paragraphs: [
        "We collect only the data necessary to operate the platform:",
        "a) Wallet Data",
        "Public wallet address when you connect your wallet",
        "b) Contact Data",
        "Email address when you contact us via forms or support",
        "c) Technical Data",
      ],
      items: [
        "IP address",
        "Browser type and device information",
        "Basic usage data",
      ],
    },
    {
      title: "2. How We Collect Data",
      paragraphs: [
        "We collect data when you:",
        "We may also use cookies or similar technologies.",
      ],
      items: [
        "Connect a wallet to the platform",
        "Interact with the website",
        "Submit a contact form",
      ],
    },
    {
      title: "3. Purpose of Data Processing",
      paragraphs: ["We process your data to:"],
      items: [
        "Provide and operate the platform",
        "Respond to inquiries and support requests",
        "Improve performance and user experience",
        "Maintain security and prevent abuse",
      ],
    },
    {
      title: "4. Analytics",
      paragraphs: [
        "We use Google Analytics only after you explicitly opt in through our analytics consent banner.",
        "If you consent, Google Analytics may collect pseudonymous usage data and set cookies to help us understand traffic and site interactions.",
        "You can change your analytics choice later from the Analytics Settings link in the website footer.",
      ],
    },
    {
      title: "5. Third-Party Services",
      paragraphs: ["We may use third-party providers for:"],
      items: [
        "Hosting and infrastructure (e.g., Vercel, Railway)",
        "Blockchain interaction services",
        "Analytics tools",
      ],
    },
    {
      title: "6. Cookies",
      paragraphs: ["Cookies may be used to:"],
      items: [
        "Maintain session functionality",
        "Analyze usage after you opt in to analytics cookies",
        "Improve performance",
      ],
    },
    {
      title: "7. Data Retention",
      paragraphs: [
        "We retain personal data only as long as necessary for the purposes described above.",
        "Blockchain data (such as transactions and wallet addresses) is public and cannot be altered or deleted.",
      ],
    },
    {
      title: "8. Your Rights (GDPR)",
      paragraphs: [
        "If you are located in the European Economic Area, you have the right to:",
        "To exercise your rights, contact us using the details below.",
      ],
      items: [
        "Access your personal data",
        "Request correction or deletion",
        "Restrict or object to processing",
        "Request data portability",
      ],
    },
    {
      title: "9. Security",
      paragraphs: [
        "We implement reasonable technical and organizational measures to protect your data.",
        "However, no system is completely secure.",
      ],
    },
    {
      title: "10. Contact",
      paragraphs: [
        "For questions or legal inquiries, please use the Contact Us section available on the platform.",
      ],
    },
  ],
};

export const TERMS_OF_USE_CONTENT: LandingDocumentContent = {
  title: "Terms of Use",
  updatedAtLabel: "Updated 13/04/2026",
  description: "Terms of Use for Dr3amo.",
  introParagraphs: [
    "By accessing or using Dr3amo, you agree to be bound by these Terms of Use.",
  ],
  sections: [
    {
      title: "1. Overview",
      paragraphs: [
        "Dr3amo provides access to decentralized escrow smart contracts deployed on blockchain networks.",
        "We do not act as a financial institution, broker, custodian, or intermediary.",
      ],
    },
    {
      title: "2. Non-Custodial Nature",
      paragraphs: [
        "Dr3amo does not hold or control user funds.",
        "All funds are managed exclusively by smart contracts, and users interact with them directly through their own wallets.",
      ],
    },
    {
      title: "3. User Responsibilities",
      items: [
        "Securing your wallet and private keys",
        "Verifying transaction details before execution",
        "Ensuring the accuracy of escrow agreements",
      ],
      paragraphs: ["All blockchain transactions are final and irreversible."],
    },
    {
      title: "4. Fees",
      items: [
        "No fees are charged when creating an escrow",
        "The fee is applied automatically during withdrawal or refund transactions",
        "Fees are transparently displayed before transaction confirmation",
        "The fee applies to both successful releases and refunds",
      ],
      paragraphs: [
        "Dr3amo charges a 1% fee on the total escrow amount, applied at the time of fund release or refund.",
        "All fees are non-refundable once processed.",
      ],
    },
    {
      title: "5. Risks",
      paragraphs: [
        "By using Dr3amo, you acknowledge and accept the risks associated with blockchain technology, including:",
      ],
      items: [
        "Smart contract vulnerabilities",
        "Network congestion and gas fees",
        "Irreversible or failed transactions",
      ],
    },
    {
      title: "6. No Liability",
      paragraphs: [
        "To the fullest extent permitted by law, Dr3amo is provided \"as is\" without warranties of any kind.",
        "We are not liable for:",
      ],
      items: [
        "Loss of funds",
        "Smart contract errors or vulnerabilities",
        "User mistakes or misuse",
        "Third-party infrastructure failures",
      ],
    },
    {
      title: "7. Disputes",
      paragraphs: [
        "Dr3amo does not mediate disputes between users.",
        "Users are solely responsible for defining and agreeing upon the terms of their escrow arrangements.",
      ],
    },
    {
      title: "8. Prohibited Use",
      paragraphs: ["You agree not to use Dr3amo for:"],
      items: [
        "Illegal activities",
        "Fraudulent transactions",
        "Any activity that violates applicable laws",
      ],
    },
    {
      title: "9. Termination",
      paragraphs: [
        "We reserve the right to restrict or terminate access to the platform at any time, without prior notice.",
      ],
    },
    {
      title: "10. Governing Law",
      paragraphs: ["These Terms are governed by the laws of Germany."],
    },
    {
      title: "11. Changes",
      paragraphs: [
        "We may update these Terms at any time.",
        "Continued use of Dr3amo constitutes acceptance of the updated Terms.",
      ],
    },
    {
      title: "12. Contact",
      paragraphs: [
        "For questions or legal inquiries, please use the Contact Us section available on the platform.",
      ],
    },
  ],
};
