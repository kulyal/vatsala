# Prompt Master

A Claude Code mod that rewrites the rough prompt in your prompt box into a clearer,
more complete one before you send it.

- **Button (terminal, desktop app):** a `✨ Prompt Master` button in the band directly
  above the prompt box. Type a rough prompt, press it, and the draft is replaced with
  the rewrite. Nothing is sent: edit it or press Enter. `Undo rewrite` puts your
  original back.
- **Panel (phone and everywhere else):** a Prompt Master panel with the same button and
  a field of its own. Type the rough prompt there, press rewrite, then Send or Copy the
  result. It opens by itself when a phone joins the session; `/prompt-master` opens it
  anywhere.
- **Command:** `/prompt-master <rough prompt>` does the same rewrite from anywhere.

The rewrite is one model call (`sonnet`; change `MODEL` in
`prompt-master/hooks/register.tsx`). It keeps your facts, paths and code verbatim,
adds no tasks you did not ask for, and never answers the prompt itself.

## Run it

```sh
claude --plugin-dir ./prompt-master
```

## Check it

```sh
claude plugin validate ./prompt-master
claude plugin test ./prompt-master
```
