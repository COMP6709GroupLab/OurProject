import React from 'react'

export function UsageAction() {
  return (
    <p className="mt-10 text-center text-lg text-gray-500 sm:text-2xl">
      Please copy and paste Bilibili video link directly into the input box below
      <a className="text-sky-400" href="https://www.bilibili.com/" target="_blank" rel="noopener noreferrer">
        {' bilibili.com/'}
      </a>
      👇
    </p>
  )
}
