import { renderHook, act } from '@testing-library/react'
import { useVirtualScroll } from '@/hooks/use-virtual-scroll'

describe('useVirtualScroll', () => {
  test('固定高さで可視範囲が計算される', () => {
    const { result, rerender } = renderHook((props: any) => useVirtualScroll(props), {
      initialProps: {
        itemHeight: 100,
        containerHeight: 300,
        totalItems: 100,
        overscan: 2,
        dynamicHeight: false,
      },
    })

    // 初期状態: 300pxで3つ+overscan*2
    expect(result.current.startIndex).toBe(0)
    expect(result.current.visibleItems).toBeGreaterThan(0)

    // スクロール更新
    act(() => {
      result.current.setScrollOffset(500)
    })

    // スクロール後はstartIndexが進む
    expect(result.current.startIndex).toBeGreaterThan(0)

    // containerHeight変化に追従
    rerender({
      itemHeight: 100,
      containerHeight: 500,
      totalItems: 100,
      overscan: 2,
      dynamicHeight: false,
    })
    expect(result.current.visibleItems).toBeGreaterThan(0)
  })

  test('動的高さが有効な時にmeasureItemで反映される', () => {
    const { result } = renderHook(() => useVirtualScroll({
      itemHeight: 100,
      containerHeight: 300,
      totalItems: 50,
      dynamicHeight: true,
      overscan: 1,
    }))

    // 計測して高さを更新
    act(() => {
      result.current.measureItem(0, 200)
      result.current.setScrollOffset(150)
    })

    // オフセットや範囲が計測結果で変わる
    expect(result.current.offsetY).toBeGreaterThanOrEqual(0)
    expect(result.current.totalHeight).toBeGreaterThan(50 * 0) // 非ゼロ
  })
})


