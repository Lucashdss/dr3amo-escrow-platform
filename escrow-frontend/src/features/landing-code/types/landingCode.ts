export type LandingCodeLine = {
  content: string;
  number: number;
};

export type LandingCodeResponse = {
  fileName: string;
  githubUrl: string;
  lines: LandingCodeLine[];
  subtitle: string;
  title: string;
};
