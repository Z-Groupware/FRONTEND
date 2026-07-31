/** 좌측 설명의 점 목록. 온보딩 각 단계가 같은 형태로 쓴다. */
export function StepHintList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-[7px]">
      {items.map((item) => (
        <li key={item} className="text-muted-foreground flex gap-[7px] text-xs leading-[19px]">
          <span className="bg-foreground mt-[7px] size-[3.5px] shrink-0 rounded-full" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}
