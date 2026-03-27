# 주요 컴포넌트 명세

> 컴포넌트 작업 시 이 문서를 참조한다.
> 컴포넌트 패턴(Server/Client 분리 기준 등)은 `claude.md`의 코드 패턴 가이드 섹션 참조.

---

## CategoryGrid

- 카테고리 아이콘을 그리드로 표시
- 모바일: 3열, 데스크톱: 6열
- 대분류 6개 클릭 시 `/styles?categoryId=`로 이동

## StyleCard

- 셀럽 착용 사진 + 이름 + 색상 배지
- next/image 사용, lazy loading 필수
- 클릭 시 `/styles/[id]`로 이동

## ProductCompareCard

- 상품 이미지 + 브랜드명 + 상품명 + 가격
- 유사도 점수 시각적 표시 (프로그레스 바 등)
- 클릭 시 `/products/[id]`로 이동

## PurchaseLinkList

- 플랫폼 로고 + 이름 + 가격 + 재고 상태
- 최저가 하이라이트
- 클릭 시 외부 URL 새 탭 오픈 (`target="_blank"`, `rel="noopener noreferrer"`)

## FilterBar

- 성별(남/여) 단일 선택(선택 해제 시 전체), 색상 다중 선택
- Zustand `useFilterStore`와 연동
- URL 쿼리 파라미터와 동기화 (`useSearchParams`)
