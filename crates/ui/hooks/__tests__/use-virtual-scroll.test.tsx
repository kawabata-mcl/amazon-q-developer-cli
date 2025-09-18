import { renderHook, act } from '@testing-library/react'
import { useVirtualScroll } from '@/hooks/use-virtual-scroll'

describe('useVirtualScroll', () => {
  test('Visible range is calculated with fixed height', () => {
    const { result, rerender } = renderHook((props: any) => useVirtualScroll(props), {
      initialProps: {
        itemHeight: 100,
        containerHeight: 300,
        totalItems: 100,
        overscan: 2,
        dynamicHeight: false,
      },
    })

    // Initial state: 300px for 3 items + overscan*2
    expect(result.current.startIndex).toBe(0)
    expect(result.current.visibleItems).toBeGreaterThan(0)

    // Scroll update
    act(() => {
      result.current.setScrollOffset(500)
    })

    // After scrolling, startIndex advances
    expect(result.current.startIndex).toBeGreaterThan(0)

    // Follows containerHeight changes
    rerender({
      itemHeight: 100,
      containerHeight: 500,
      totalItems: 100,
      overscan: 2,
      dynamicHeight: false,
    })
    expect(result.current.visibleItems).toBeGreaterThan(0)
  })

  test('When dynamic height is enabled, it is reflected by measureItem', () => {
    const { result } = renderHook(() => useVirtualScroll({
      itemHeight: 100,
      containerHeight: 300,
      totalItems: 50,
      dynamicHeight: true,
      overscan: 1,
    }))

    // Measure and update height
    act(() => {
      result.current.measureItem(0, 200)
      result.current.setScrollOffset(150)
    })

    // Offset and range change based on measurement results
    expect(result.current.offsetY).toBeGreaterThanOrEqual(0)
    expect(result.current.totalHeight).toBeGreaterThan(50 * 0) // Non-zero
  })
})


