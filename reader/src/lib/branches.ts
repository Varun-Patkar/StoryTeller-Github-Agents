export interface BranchTarget {
  name: string;
  href: string;
}

export function getBranchTargets(rootBase: string): BranchTarget[] {
  const segments = rootBase.split('/').filter(Boolean);
  const root = segments.length > 0 ? `/${segments.join('/')}/` : '/';
  return [
    { name: 'main', href: root },
    {
      name: 'evaluation/story-skills',
      href: `${root}branches/evaluation-story-skills/`,
    },
  ];
}