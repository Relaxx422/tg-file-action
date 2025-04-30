import * as core from '@actions/core'
import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
    // Wrap logic in try-catch for better error handling
    const token = core.getInput('token', { required: true })
    const chatId = core.getInput('chat-id', { required: true })
    const message = core.getInput('body')
    const documentsInput = core.getInput('files') // Rename input variable

    // Split the input string by newlines, trim whitespace, and filter empty lines
    const documentPaths = documentsInput
      .split('\n')
      .map((p) => p.trim()) // Remove leading/trailing whitespace
      .filter((p) => p.length > 0) // Remove empty lines

    const file_count = documentPaths.length

    const bot = new TelegramBot(token, { polling: false })

    // --- File sending logic with validation ---
    if (file_count > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const media: any[] = []

      for (const filePath of documentPaths) {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
          core.setFailed(`File not found: ${filePath}`)
        }

        media.push({
          type: 'document',
          media: filePath
        })
      }

      // Only add the caption for the last item in the media array
      const lastMedia = media[media.length - 1]
      lastMedia.caption = message

      if (file_count == 1) {
        await bot.sendDocument(chatId, documentPaths[0], {
          caption: message || undefined
        })
      }

      await bot.sendMediaGroup(chatId, media)
    }

    core.info('Send files to Telegram successfully.')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occurred.')
    }
  }
}
