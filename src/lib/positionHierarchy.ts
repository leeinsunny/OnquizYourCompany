/**
 * Position Hierarchy System for OnQuiz
 * 직급 기반 멤버 할당 시스템
 */

export interface Position {
  level: number;           // 낮을수록 높은 직급
  label: string;           // 한글 직급명
  canCreateQuiz: boolean;  // 퀴즈 생성 권한
  canAssign: boolean;      // 할당 권한 여부
}

/**
 * 직급 계층 정의
 * level이 낮을수록 높은 직급
 */
export const POSITION_HIERARCHY: Record<string, Position> = {
  '이사': {
    level: 1,
    label: '이사',
    canCreateQuiz: true,
    canAssign: true
  },
  '본부장': {
    level: 2,
    label: '본부장',
    canCreateQuiz: true,
    canAssign: true
  },
  '부장': {
    level: 3,
    label: '부장',
    canCreateQuiz: true,
    canAssign: true
  },
  '차장': {
    level: 4,
    label: '차장',
    canCreateQuiz: true,
    canAssign: true
  },
  '과장': {
    level: 5,
    label: '과장',
    canCreateQuiz: true,
    canAssign: true
  },
  '팀장': {
    level: 6,
    label: '팀장',
    canCreateQuiz: true,
    canAssign: true
  },
  '대리': {
    level: 7,
    label: '대리',
    canCreateQuiz: false,
    canAssign: false
  },
  '사원': {
    level: 8,
    label: '사원',
    canCreateQuiz: false,
    canAssign: false
  },
  '인턴': {
    level: 9,
    label: '인턴',
    canCreateQuiz: false,
    canAssign: false
  }
};

/**
 * 직급 레벨 가져오기
 */
export const getPositionLevel = (jobTitle: string | null): number => {
  if (!jobTitle) return 999; // 직급 없으면 가장 낮은 레벨
  const position = POSITION_HIERARCHY[jobTitle];
  return position ? position.level : 999;
};

/**
 * 할당 가능한 멤버 필터링
 * 현재 사용자보다 낮은 직급만 반환
 */
export const filterAssignableMembers = (
  currentUserJobTitle: string | null,
  members: any[]
): any[] => {
  const currentLevel = getPositionLevel(currentUserJobTitle);
  
  return members.filter(member => {
    const memberLevel = getPositionLevel(member.job_title);
    return memberLevel > currentLevel; // 숫자가 크면 낮은 직급
  });
};

/**
 * 할당 가능 여부 확인
 */
export const canAssignToMember = (
  assignerJobTitle: string | null,
  targetJobTitle: string | null
): boolean => {
  const assignerLevel = getPositionLevel(assignerJobTitle);
  const targetLevel = getPositionLevel(targetJobTitle);
  
  return targetLevel > assignerLevel;
};

/**
 * 퀴즈 생성 권한 확인
 */
export const canCreateQuiz = (jobTitle: string | null): boolean => {
  if (!jobTitle) return false;
  const position = POSITION_HIERARCHY[jobTitle];
  return position ? position.canCreateQuiz : false;
};

/**
 * 할당 권한 확인
 */
export const canAssign = (jobTitle: string | null): boolean => {
  if (!jobTitle) return false;
  const position = POSITION_HIERARCHY[jobTitle];
  return position ? position.canAssign : false;
};

/**
 * 직급 목록 가져오기 (레벨 순서대로)
 */
export const getPositionList = (): Position[] => {
  return Object.values(POSITION_HIERARCHY).sort((a, b) => a.level - b.level);
};

/**
 * 에러 메시지
 */
export const ASSIGNMENT_ERROR_MESSAGES = {
  NO_PERMISSION: '현재 직급에서는 선택할 수 없는 멤버입니다.',
  NO_ASSIGN_AUTHORITY: '퀴즈를 할당할 권한이 없습니다.',
  NO_CREATE_AUTHORITY: '퀴즈를 생성할 권한이 없습니다.'
} as const;
