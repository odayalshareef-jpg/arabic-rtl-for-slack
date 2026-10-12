// Every Slack selector the extension uses lives in this file.
// When Slack changes its markup, this is the only file that should need editing.
// Keep them narrow: they must match message *text* and the composer only,
// never the message row (which holds the avatar, name, timestamp and reactions).
self.SLACK_RTL_SELECTORS = {
  // Paragraph-level blocks inside a rendered message. Each one gets its own direction,
  // so a message with one Arabic line and one English line renders each line correctly.
  // If one of these contains another (e.g. a wrapper around sections), only the innermost is changed.
  messageBlocks: [
    ".c-message_kit__blocks .p-rich_text_section",
    ".c-message_kit__blocks .p-rich_text_quote",
    ".c-message_kit__blocks ul.p-rich_text_list",
    ".c-message_kit__blocks ol.p-rich_text_list",
    // Older / plain-text messages that are not rendered as rich text blocks.
    ".c-message__body",
    "[data-qa='message-text']",
    // Attachment text.
    ".c-message_attachment__text"
  ],

  // Quotes: when one turns right-to-left, its side bar is moved to the right as well.
  quotes: [
    ".p-rich_text_quote",
    "blockquote"
  ],

  // Blocks that must always stay left-to-right (code), even inside an Arabic message.
  alwaysLtr: [
    ".c-message_kit__blocks .p-rich_text_preformatted",
    ".c-message_kit__blocks code",
    ".c-message_kit__blocks pre"
  ],

  // Parts of a message that should not decide its direction: @mentions, #channels,
  // and emoji (their text is usually Latin even in an Arabic sentence). URLs are skipped in content.js.
  ignoreForDetection: [
    ".c-member_slug",
    ".c-channel_entity",
    ".c-usergroup_slug",
    ".c-emoji"
  ],

  // Inline pieces kept in their own reading order inside an RTL line, so "@Ahmed" doesn't
  // render as "Ahmed@" and links and file names keep their punctuation in place.
  isolateInRtl: [
    ".c-member_slug",
    ".c-channel_entity",
    ".c-usergroup_slug",
    "a.c-link",
    "code"
  ],

  // The message composer itself (main channel input, thread reply input, edit box).
  composerEditor: [
    "[data-qa='message_input'] .ql-editor",
    ".c-texty_input_unstyled .ql-editor"
  ],

  // Lines inside the composer. Handled with CSS `unicode-bidi: plaintext`, so each line
  // picks its own direction as you type without the extension rewriting the editor's DOM.
  composerLines: [
    "[data-qa='message_input'] .ql-editor > p",
    "[data-qa='message_input'] .ql-editor > ol > li",
    "[data-qa='message_input'] .ql-editor > ul > li",
    "[data-qa='message_input'] .ql-editor > blockquote",
    ".c-texty_input_unstyled .ql-editor > p",
    ".c-texty_input_unstyled .ql-editor > ol > li",
    ".c-texty_input_unstyled .ql-editor > ul > li",
    ".c-texty_input_unstyled .ql-editor > blockquote"
  ]
};
