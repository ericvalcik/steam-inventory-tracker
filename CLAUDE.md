# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tools

Always use Context7 MCP tools for code generation, setup/configuration steps, and library/API documentation. This means automatically calling `mcp__plugin_context7_context7__resolve-library-id` and `mcp__plugin_context7_context7__query-docs` without waiting to be asked.

Use the `agent-browser` skill to visually verify UI changes — navigate to the running app and take a screenshot to confirm a change renders correctly, rather than relying on the code diff alone.

## Rules

Don't run full project builds after doing changes unless asked specifically by the user, only lint the changes.
