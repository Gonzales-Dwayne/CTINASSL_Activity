import searchSvg from '../icons/Search.svg'
import cartSvg from '../icons/Shopping cart.svg'
import userSvg from '../icons/User.svg'
import arrowRightSvg from '../icons/Arrow right.svg'

/**
 * Thin wrappers around the exported SVG files in `src/icons/`.
 *
 * The artwork stays in the .svg files (single source of truth, easy to
 * re-export from Figma). Pass `size`, `className` or `style` as needed.
 *
 *   import { SearchIcon } from './components/Icons'
 *   <SearchIcon size={24} />
 *   <CartIcon title="Cart" />
 */

function Icon({ src, size = 24, title, className, style, ...rest }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={title ?? ''}
      className={className}
      style={{ display: 'block', ...style }}
      {...rest}
    />
  )
}

export function SearchIcon(props) {
  return <Icon src={searchSvg} {...props} />
}

export function CartIcon(props) {
  return <Icon src={cartSvg} {...props} />
}

export function UserIcon(props) {
  return <Icon src={userSvg} {...props} />
}

export function ArrowRightIcon(props) {
  return <Icon src={arrowRightSvg} {...props} />
}
