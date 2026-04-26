export interface HubEntry {
  id: string
  index: string
  slug: string
  title: string
  sub: string
  status: 'LIVE' | 'DRAFT' | 'SOON'
}

export const hub = {
  masthead: 'gguip1',
  intro: '단 하나의 주소, 여러 개의 챕터.',
  subintro:
    '이 도메인은 한 사람을 중심으로 쌓입니다. 각 챕터는 자기 주소를 갖고 살며, 앞으로도 그럴 예정입니다.',
  entries: [
    {
      id: 'me',
      index: '01',
      slug: '/me',
      title: '이기용',
      sub: 'DevOps · Cloud Engineer',
      status: 'LIVE',
    },
    {
      id: 'blog',
      index: '02',
      slug: '/blog',
      title: '쓴 글',
      sub: '기술·회고·메모',
      status: 'LIVE',
    },
    {
      id: 'lab',
      index: '03',
      slug: '/lab',
      title: '실험실',
      sub: '짧은 도구, 짧은 실험',
      status: 'SOON',
    },
  ] satisfies HubEntry[],
  year: '2026',
}
