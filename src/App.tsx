import "./setup"
import "@mantine/core/styles.css"
import "./index.css"
import { useMemo } from "react"
import { AppState } from "./AppState"
import { VideoList } from "./VideoList"
import { VideoPlayer } from "./VideoPlayer"
import { AnnotationTools } from "./AnnotationTools"
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

                <X.AppShell.Navbar p="md">
                    <VideoList appState={appState} />
                </X.AppShell.Navbar>

                <X.AppShell.Main>
                    <X.Grid gutter="md">
                        <X.Grid.Col span={8}>
                            <VideoPlayer appState={appState} />
                        </X.Grid.Col>
                        <X.Grid.Col span={4}>
                            <AnnotationTools appState={appState} />
                        </X.Grid.Col>
                    </X.Grid>
                </X.AppShell.Main>
            </X.AppShell>
        </X.MantineProvider>
    )
})
