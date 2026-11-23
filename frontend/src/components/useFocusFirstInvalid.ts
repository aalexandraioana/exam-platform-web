import { useEffect, useRef } from 'react'

// After a failed submit, focus goes to the first field marked invalid, in form order, so keyboard
// and screen-reader users land on the problem (DESIGN.md, keyboard). `errors` must change only on
// submit or a server answer, never while typing.
export function useFocusFirstInvalid<T>(errors: T) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errors])

  return formRef
}
