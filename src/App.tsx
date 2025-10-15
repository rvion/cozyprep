import "./setup"
import "@mantine/core/styles.css"
import "./index.css"
import { useMemo } from "react"
import { AppState } from "./AppState"
import { VideoList } from "./VideoList"
import { VideoPlayer } from "./VideoPlayer"
import { observer } from "mobx-react-lite"

const theme = X.createTheme({
    /** Put your mantine theme override here */
})

export const App = observer(() => {
    const appState = useMemo(() => new AppState(), [])

    return (
        <X.MantineProvider theme={theme}>
            <X.AppShell padding="md" header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
                <X.AppShell.Header>
                    <X.Group h="100%" px="md" justify="space-between">
                        <X.Text fw={700} size="lg">
                            Video Annotation Tool
                        </X.Text>
                    </X.Group>
                </X.AppShell.Header>

                <X.AppShell.Navbar>
                    <VideoList appState={appState} />
                </X.AppShell.Navbar>

                <X.AppShell.Main>
                    <VideoPlayer appState={appState} />
                </X.AppShell.Main>
            </X.AppShell>
        </X.MantineProvider>
    )
})
