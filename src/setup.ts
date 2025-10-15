declare global {
    const X: typeof import("@mantine/core")
    const H: typeof import("@mantine/hooks")
}

import * as X from "@mantine/core"
import * as H from "@mantine/hooks"
;(window as any).X = X
;(window as any).H = H
