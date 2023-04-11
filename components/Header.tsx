import { Poppins } from '@next/font/google'
import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'
import SignIn from '~/components/SignIn'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { BASE_DOMAIN } from '~/utils/constants'
import Github from '../components/GitHub'
const poppins = Poppins({ weight: '800', subsets: ['latin'] })

export default function Header({ showSingIn }: { showSingIn: (show: boolean) => void }) {
  return (
    <header className="supports-backdrop-blur:bg-white/60 max-w-8xl sticky top-0 z-40 mx-auto w-full flex-none border-b border-slate-900/10 bg-white/95 pt-2 backdrop-blur  transition-colors duration-500 dark:border-slate-50/[0.06] dark:border-slate-300/10 dark:bg-transparent lg:z-50 lg:mx-0 lg:border-0 lg:border-b lg:border-slate-900/10 lg:px-8">
      <div className="flex items-center justify-between px-3 sm:px-3">
        <div className="flex items-center space-x-3">
          <h2 className={clsx('text-lg sm:text-2xl', poppins.className)}>
            <span className="font-semibold italic text-blue-500">Bilibili Summary </span>{' '}
            <span className="ml-2 text-red-500">Poly</span>GPT
          </h2>
        </div>
        {/* <div className="flex shrink-0 items-center space-x-2 sm:space-x-5">
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://jimmylv.feishu.cn/share/base/form/shrcn9PwPzGGGiJCnH0JNfM1P3b"
                rel="noreferrer noopener"
                target="_blank"
                className="flex items-center space-x-2"
              >
                🔥<span className="hidden pl-1 sm:block">提</span>反馈
              </a>
            </TooltipTrigger>
            <TooltipContent>那可太感谢啦！</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <a
                href="javascript:(function(){if (window.location.hostname.includes('bilibili.com') || window.location.hostname.includes('youtube.com')) {window.open(location.href.replace('.com', '.jimmylv.cn'), '_blank');} else {alert('🔖请进入B站或YouTube视频页面，再来点击书签哦！');}}())"
                rel="noreferrer noopener"
                target="_blank"
                className="flex hidden items-center space-x-2 sm:block"
                aria-label="书签版"
                onClick={() => alert('🔖请拖至书签栏，进入B站或YouTube视频页面，再来点击书签哦！')}
              >
                🔖
                <span className="relin-paragraph-target pl-1 text-slate-500">(书签版)</span>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>🔖请拖至书签栏，进入B站视频页面再点击书签哦！</p>
            </TooltipContent>
          </Tooltip>
          <a
            href={BASE_DOMAIN + '/ios'}
            rel="noreferrer noopener"
            target="_blank"
            className="flex items-center space-x-2"
            aria-label="iOS版"
          >
            <Image src="/shortcuts.png" alt="logo" width={33} height={33} className="max-w-none" />
            <span className="relin-paragraph-target hidden text-slate-500 sm:block">(iOS版)</span>
          </a>
          <a href="https://github.com/JimmyLv/BibiGPT" rel="noreferrer noopener" target="_blank" className="">
            <Github width="33" height="33" />
          </a>
          <SignIn showSingIn={showSingIn} />
        </div> */}
      </div>
    </header>
  )
}
