import React from 'react'

export const useFlasher = () => {
  const ref: any = React.useRef()
  React.useEffect(() => {
    ref.current.setAttribute(
      'style',
      `box-shadow: 0 0 8px 1px #d81b60;
       background-color: #fce4ec!important;
       transition: box-shadow 50ms ease-out;`
    )
    setTimeout(() => ref.current.setAttribute('style', ''), 100)
  })
  return ref
}