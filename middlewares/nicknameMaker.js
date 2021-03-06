// 형용사 + 형용사 + 명사 의 조합 반환
const nickname = function () {
  // ~ 하고
  const adjective_1 = [
    '사랑스럽고 ',
    '매력적이고 ',
    '자신감있고 ',
    '우아하고 ',
    '품격있고 ',
    '헐벗은 ',
    '공정하고 ',
    '추잡하고 ',
    '성격더럽고 ',
    '보기좋게 ',
    '완벽하고 ',
    '꾀죄죄하고 ',
    '지저분하고 ',
    '허풍의 ',
    '빈곤하고 ',
    '비열하고 ',
    '야생의 ',
    '자연의 ',
    '바보같고 ',
    '또라이의 ',
    '수줍어하고 ',
    '엄격하고 ',
    '수다스럽고 ',
    '밉상에다 ',
    '불쾌하고 ',
    '이기적인 ',
    '신경질적인 ',
    '변덕스러운 ',
    '깍쟁이에다 ',
    '비겁하고 ',
  ];

  // ~ 한
  const adjective_2 = [
    '허세있는 ',
    '집착이심한 ',
    '강압적인 ',
    '뻥이심한 ',
    '고집센 ',
    '깐죽거리는 ',
    '예의없는 ',
    '깡다구있는 ',
    '사려갚은 ',
    '침착한 ',
    '합리적인 ',
    '근면한 ',
    '친절한 ',
    '애교있는 ',
    '형편없는 ',
    '사려깊은 ',
    '끈질긴 ',
    '더러운 ',
    '역겨운 ',
    '미치광이인 ',
    '용감한 ',
    '보수적인 ',
    '잘속는 ',
    '무책임한 ',
    '속이좁은 ',
    '수줍은 ',
    '못된 ',
    '잘노는 ',
    '단호한 ',
    '통제광인 ',
  ];

  // 명사
  const noun = [
    '닭',
    '똥멍청이',
    '돼지',
    '바보',
    '피카츄',
    '철인',
    '초사이언',
    '나루토',
    '근육맨',
    '미남',
    '인턴',
    '개발자',
    '발가락',
    '코끼리',
    '다람쥐',
    '대머리',
    '뚜벅초',
    '귀요미',
    '국밥',
    '백엔드',
    '스파이',
    '쾌남',
    '회장님',
    '매생이',
    '우엉조림',
    '나',
    '개척자',
    '김정은',
    '잡채',
    '주인공',
  ];

  let adjPick_1 = adjective_1[Math.floor(Math.random() * 30)];
  let adjPick_2 = adjective_2[Math.floor(Math.random() * 30)];
  let nounPick = noun[Math.floor(Math.random() * 30)];

  return adjPick_1 + adjPick_2 + nounPick;
};

module.exports = nickname;
