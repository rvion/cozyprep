import { useRef } from "react"
import { observable } from "mobx"

/** Converts props to a stable observable object that updates reactively */
export function usePropsAsStableObservableObject<T extends object>(props: T): T {
    const ref = useRef<T | null>(null)

    if (!ref.current) {
        ref.current = observable(props, {}, { autoBind: true })
    }

    // Update all properties
    Object.assign(ref.current, props)

    return ref.current
}
