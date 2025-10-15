import "./setup"
import { APITester } from "./APITester"
import "@mantine/core/styles.css"
import "./index.css"

const theme = X.createTheme({
    /** Put your mantine theme override here */
})

export const App = () => {
    const [opened, { toggle }] = H.useDisclosure()

    return (
        <X.MantineProvider theme={theme}>
            <X.AppShell padding="md" header={{ height: 60 }} navbar={{ width: 300, breakpoint: "sm" }}>
                <X.AppShell.Header>
                    <X.Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    <div>Logo</div>
                </X.AppShell.Header>
                <X.AppShell.Navbar>Navbar</X.AppShell.Navbar>
                <X.AppShell.Main>
                    <X.Input name="test" />
                    <div>FUCK</div>
                    <APITester />
                </X.AppShell.Main>
            </X.AppShell>
            {/* Your app here */}
        </X.MantineProvider>
    )
}
