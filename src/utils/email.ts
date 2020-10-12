import * as nodemailer from "nodemailer"
import * as Types from "../types"

export class Handler {
    constructor(mailConfigData: Types.mailConfig, mailTemplates: Types.emailCompositor[]) {
        this.mailTemplates = mailTemplates
        this.transporter = nodemailer.createTransport(mailConfigData)
    }

    private mailTemplates: Types.emailCompositor[]
    private transporter

    private currentComposition: Types.composedEmail

    public construct = (
        queryKind: string,
        messageConfig: Types.messageConfig,
        replacements: Types.templateReplaces[],
        DBExitCode: number
    ): number => {
        // debugger
        if (DBExitCode === 0) {
            const availableQueries = this.mailTemplates.map((composition) => {
                return composition.queryKind
            })

            const compositionIndex = availableQueries.indexOf(queryKind)

            let htmlBody = this.mailTemplates[compositionIndex].body

            debugger

            replacements.forEach((replacement, index) => {
                const target = new RegExp(
                    `\{\{${index + 1}\/\/(${replacement.target})+\/\/\}\}`,
                    "gm"
                )
                htmlBody = htmlBody.replace(target, replacement.content)
            })

            this.currentComposition = {
                messageConfig: messageConfig,
                body: htmlBody,
            }

            return 0
        }

        return 1
    }

    public send = async (): Promise<number> => {
        await this.transporter.sendMail({
            from: this.currentComposition.messageConfig.from,
            to: this.currentComposition.messageConfig.to,
            subject: this.currentComposition.messageConfig.subject,
            html: this.currentComposition.body,
        })

        return 0
    }
}
