// 이 파일은 자동 생성됩니다. 직접 수정하지 마세요.
// 원본: euidaeguard-backend/app/safety/abusive_lexicon.py
// 재생성: cd euidaeguard-backend && python scripts/export_lexicon_ts.py
//
// 욕설·위협 감지 전용 어휘 사전. 화면에 보여 주거나 생성 프롬프트에 넣지 않는다.

// 욕설·인신공격
export const PROFANITY: string[] = [
  "씨발", "시발", "씨팔", "시팔", "씨빨", "시빨",
  "씨바", "시바", "씨불", "시불", "씨부럴", "씨부랄",
  "씨불알", "씨발놈", "씨발년", "시발놈", "시발년", "씨발새끼",
  "시발새끼", "씨발것", "씨발넘", "쓰발", "쓰팔", "스발",
  "썅", "십할", "씹할", "씹새", "씹새끼", "씹년",
  "씹놈", "십새끼", "십새", "십팔", "십팔놈", "아이씨",
  "에이씨", "에이씨발", "아우씨", "좆", "좆같", "존같",
  "좇같", "좆도", "좆밥", "개좆", "좆만", "존나",
  "졸라", "존내", "개존나", "병신", "븅신", "빙신",
  "벼엉신", "병신같", "병신새끼", "병신아", "븅딱", "등신",
  "등신같", "머저리", "멍청이", "멍청한", "모지리", "찐따",
  "쪼다", "바보같", "돌대가리", "대가리", "개새끼", "개세끼",
  "개색끼", "개색기", "개시끼", "개삭기", "새끼야", "새끼가",
  "새끼들", "이새끼", "저새끼", "그새끼", "호로새끼", "호로자식",
  "후레자식", "불한당", "개자식", "자식아", "미친새끼", "미친놈",
  "미친년", "미친것", "미쳤나", "미친거", "개년", "이년",
  "저년", "그년", "년아", "이놈", "저놈", "놈아",
  "쌍놈", "쌍년", "상놈", "상년", "잡놈", "잡년",
  "지랄", "지럴", "개지랄", "지랄한다", "지랄하네", "지랄맞",
  "개소리", "개수작", "개판", "개똥", "개풀", "헛소리",
  "니미", "니미럴", "니미랄", "네미", "니애미", "니에미",
  "느금", "느그애미", "니애비", "니아비", "애미없", "애비없",
  "엠창", "엄창", "부모가", "부모없", "애미는", "니 어미",
  "니 아비", "꺼져", "꺼지라", "닥쳐", "닥치라", "닥쳐라",
  "아가리", "주둥이", "처먹", "쳐먹", "처밀", "나불",
  "나불대", "짖지마", "짖네", "돌아이", "또라이", "개돼지",
  "짐승만도", "인간말종", "쓰레기같", "재수없", "밥맛없", "역겹",
  "꼴받", "빡친다",
];

// 강한 욕설
export const SEVERE_PROFANITY: string[] = [
  "씨발새끼", "시발새끼", "개새끼", "미친새끼", "병신새끼", "좆같",
  "씹새끼", "호로새끼", "후레자식", "느금마", "니애미", "애미없",
  "애비없", "엠창",
];

// 초성 욕설
export const CHOSUNG_PROFANITY: string[] = [
  "ㅅㅂ", "ㅆㅂ", "ㅅㅃ", "ㅂㅅ", "ㅄ", "ㄱㅅㄲ",
  "ㄲㅈ", "ㅈㄴ", "ㅈㄹ", "ㅁㅊ", "ㅆㄹㄱ", "ㄴㅁ",
  "ㅗ",
];

// 인격 모독·직업 비하
export const CONTEMPT: string[] = [
  "알바 주제", "알바나", "알바따위", "알바 쓰는", "고작 알바", "너 따위",
  "니 따위", "니까짓", "너같은게", "니가 뭔데", "뭐 이런게", "사람 취급",
  "무시하냐", "무시해", "우습게", "배운게", "못 배워", "배워먹",
  "교육을 못", "가정교육", "어디서 굴러", "기어나와", "기어들어", "굴러먹",
  "이런것도 못", "이것도 못하", "일 못하", "월급이 아깝", "무릎 꿇", "무릎꿇",
  "사표 써", "잘리게", "짤리게", "그만두게", "옷 벗겨", "내가 누군지",
  "내가 누구인지", "너 이름이", "명찰", "천박", "수준 낮", "못배운",
  "저질", "싸가지", "싹수",
];

// 성희롱
export const SEXUAL_HARASSMENT: string[] = [
  "몸매", "가슴 만", "가슴을 만", "가슴이 크", "엉덩이", "다리 예쁘",
  "몸 좋", "야하", "야한", "벗어봐", "벗겨", "만져봐",
  "만지자", "손 좀 잡", "안아보", "뽀뽀", "키스", "자고 가",
  "자고 갈", "모텔", "여관", "번호 줘", "번호 내놔", "전화번호 알려",
  "연락처 줘", "애인 있", "남친 있", "여친 있", "사귀자", "술 한잔",
  "이쁜이", "귀엽네", "몇 살이야", "몇살이니", "혼자 사", "집이 어디",
  "오빠가", "내 여자",
];

// 위협·협박
export const THREAT: string[] = [
  "죽여", "죽인다", "죽일", "죽여버", "죽여버린다", "죽여버릴",
  "죽는다", "죽을래", "죽어볼래", "죽고 싶냐", "죽고싶냐", "쥑인다",
  "쥐겨", "직인다", "주거볼래", "뒤진다", "뒤져", "뒤질래",
  "뒤져볼래", "뒤지고 싶", "뒤질줄", "디진다", "디져", "디질래",
  "골로 보", "골로 가", "묻어버린다", "묻어버릴", "파묻어", "담가버린다",
  "담가버릴", "담가줄", "매장시켜", "묻어줄", "때린다", "때릴거",
  "때릴 거", "때려줄", "때려버린다", "패버린다", "패버릴", "패줄",
  "패겠", "쳐맞", "처맞", "맞아볼래", "맞을래", "맞고 싶",
  "한 대 맞", "한대 맞", "주먹으로", "주먹 날", "밟아버린다", "밟아줄",
  "밟아버릴", "조져버린다", "조진다", "조져줄", "박살 낸다", "박살낸다",
  "박살내", "아작낸다", "아작내", "손 좀 봐", "손봐준다", "손봐줄",
  "혼구멍", "가만 안 둬", "가만 안둬", "가만두지 않", "가만 안둘", "가만 안 놔",
  "그냥 안 둬", "그냥 안둬", "끝장내", "끝장 내", "각오해", "각오하",
  "두고 보자", "두고보자", "후회하게", "후회할거", "후회한다", "재미없을",
  "재미 없을", "찾아간다", "찾아갈", "찾아가서", "쫓아간다", "쫓아갈",
  "집 앞", "집앞으로", "집까지 찾아", "집까지 쫓아", "니 집", "너희 집",
  "퇴근길", "너 언제 끝나", "밖에서 보자", "밖에서 봐", "나와봐", "따라간다",
  "따라갈", "신상 털", "신상털", "가족까지", "가족도 가만", "애들까지",
  "집안 망", "불질러", "불 지르", "불지른다", "불 질러버", "태워버린다",
  "태워버릴", "불 내버", "방화", "휘발유", "기름 뿌", "부숴버린다",
  "부순다", "부숴", "때려부", "엎어버린다", "엎어버릴", "다 엎",
  "던진다", "던질거", "던져버린다", "깨버린다", "깨부", "다 때려",
  "가게 문 닫게", "장사 못하게", "망하게 해", "망하게 만들", "목 조", "목조르",
  "목을 졸", "끌어낸다", "끌어내", "끌고 나", "머리채", "멱살",
  "피 본다", "피 보게", "병원 실려", "응급실 가", "다리 부러", "팔 부러",
  "반죽음", "손모가지", "모가지", "대갈통", "머리통",
];

// 흉기 언급
export const WEAPON: string[] = [
  "흉기", "칼부림", "칼로 찔", "칼 들고", "칼들고", "칼 가지고",
  "칼 갖고", "식칼", "회칼", "과도로", "커터칼", "면도칼",
  "찔러버린다", "찔러", "찌른다", "찔릴", "야구방망이", "빠따",
  "각목", "쇠파이프", "파이프로", "망치로", "벽돌", "송곳",
  "총으로", "총 가지고", "총 들고", "휘두를", "휘두른다", "휘두르",
];

// 공백·문장부호를 지워 "씨 발!!"과 "씨발"을 같게 만든다.
const NON_WORD = /[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]+/g;

export function normalize(text: string): string {
  return text.toLowerCase().replace(NON_WORD, "");
}

function normalizedSet(...groups: string[][]): string[] {
  const seen = new Set<string>();
  for (const group of groups) {
    for (const word of group) {
      const normalized = normalize(word);
      if (normalized) seen.add(normalized);
    }
  }
  return [...seen];
}

const PROFANITY_N = normalizedSet(PROFANITY, SEVERE_PROFANITY, CHOSUNG_PROFANITY);
const SEVERE_N = normalizedSet(SEVERE_PROFANITY);
const CONTEMPT_N = normalizedSet(CONTEMPT);
const SEXUAL_N = normalizedSet(SEXUAL_HARASSMENT);
const WEAPON_N = normalizedSet(WEAPON);
const THREAT_ONLY_N = normalizedSet(THREAT);
// 고정 안전 절차 트리거는 위협 + 흉기를 함께 본다.
const THREAT_N = normalizedSet(THREAT, WEAPON);

function match(text: string, words: string[]): string[] {
  const haystack = normalize(text);
  if (!haystack) return [];
  return words.filter((word) => haystack.includes(word));
}

export const matchProfanity = (text: string) => match(text, PROFANITY_N);
export const matchSevereProfanity = (text: string) => match(text, SEVERE_N);
export const matchContempt = (text: string) => match(text, CONTEMPT_N);
export const matchSexualHarassment = (text: string) => match(text, SEXUAL_N);
export const matchWeapon = (text: string) => match(text, WEAPON_N);
export const matchThreat = (text: string) => match(text, THREAT_N);

/** 감지된 카테고리별 매칭 단어. 비어 있는 카테고리는 넣지 않는다. */
export function detectCategories(text: string): Record<string, string[]> {
  const found: Record<string, string[]> = {
    흉기: matchWeapon(text),
    위협: match(text, THREAT_ONLY_N),
    성희롱: matchSexualHarassment(text),
    욕설: matchProfanity(text),
    인격모독: matchContempt(text),
  };
  return Object.fromEntries(
    Object.entries(found).filter(([, words]) => words.length > 0),
  );
}
