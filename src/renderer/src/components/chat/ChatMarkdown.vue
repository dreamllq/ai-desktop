<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

const rendered = computed(() => md.render(props.content))
</script>

<template>
  <div class="chat-markdown leading-relaxed" v-html="rendered"></div>
</template>

<style>
.chat-markdown p {
  margin-bottom: 0.5rem;
}

.chat-markdown p:last-child {
  margin-bottom: 0;
}

.chat-markdown strong {
  font-weight: 700;
}

.chat-markdown em {
  font-style: italic;
}

.chat-markdown ul,
.chat-markdown ol {
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}

.chat-markdown ul {
  list-style-type: disc;
}

.chat-markdown ol {
  list-style-type: decimal;
}

.chat-markdown li {
  margin-bottom: 0.125rem;
}

.chat-markdown code {
  background-color: #e5e7eb;
  color: #db2777;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}

.chat-markdown pre {
  background-color: #1f2937;
  color: #f3f4f6;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.chat-markdown pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: 0.875rem;
}

.chat-markdown a {
  color: #3b82f6;
  text-decoration: underline;
}

.chat-markdown a:hover {
  color: #1d4ed8;
}

.chat-markdown blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: #6b7280;
}

.chat-markdown h1,
.chat-markdown h2,
.chat-markdown h3 {
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.chat-markdown h1 {
  font-size: 1.25rem;
}

.chat-markdown h2 {
  font-size: 1.125rem;
}

.chat-markdown h3 {
  font-size: 1rem;
}
</style>
