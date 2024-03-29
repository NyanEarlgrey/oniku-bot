declare module 'node-json-logger' {
    type TLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
    type TLogger = {
        [level in TLevel]: (...args: any[]) => {
            timestamp: string
            level: level
            message: string
        }
    }
    type Logger = new (
        options?: Partial<{
            level: TLevel | 'none'
            loggerName: string
            timestamp: boolean
            timezone: string
        }>
    ) => TLogger
    const _: Logger
    export default _
}
