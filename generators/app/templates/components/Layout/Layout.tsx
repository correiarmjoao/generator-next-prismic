import * as React from 'react'

import { isIE, isNode } from '../../utils'

import { Navbar, Footer, CookieMessage } from '..'

import './Layout.scss'

type ILayoutProps = {
  children: React.ReactNode | React.ReactNode[]

  navbar?: any

  footer?: any

  /*
   * To show or not the Navbar
   */
  showNavbar?: boolean

  /*
   * To show or not the Navbar
   */
  showFooter?: boolean

  lang: string

  cookie_message?: any
}

class Layout extends React.Component<ILayoutProps> {
  constructor(props) {
    super(props)
    isIE()
  }

  componentDidMount() {
    if (process.env.NODE_ENV !== 'production' && !isIE()) {
      try {
        import('a11y-checker').then(a11yChecker => {
          a11yChecker.default()
        })
      } catch (e) {
        console.error('Failed to load a11y-checker', e)
      }
    }
  }

  componentDidCatch(error, errorInfo) {
    // TODO: IF NEEDED - Handle javascript exceptions
    console.log(error)
    // TODO: IF NEEDED - Send logs to backend server
  }

  render() {
    const {
      children,
      navbar,
      showNavbar = true,
      footer,
      showFooter = true,
      lang,
      cookie_message
    } = this.props

    if ((showNavbar && !navbar) || (showFooter && !footer)) {
      throw new Error('No header/footer')
    }
    
    return (
      <>
        <div className="Layout">
        <noscript>
            <div className="No-JS-message">
              <p>{"This site works best with JavaScript enabled"}</p>
            </div>
          </noscript>

          {showNavbar && navbar && <Navbar lang={lang} {...navbar} />}
          <div className="Layout-content">{children}</div>
          {showFooter && footer && <Footer lang={lang} {...footer} />}
          {cookie_message && <CookieMessage {...cookie_message} />}
        </div>
        <% if (baseComponents.includes('Portal')) { %>
        <div id="portal"></div><% } %>
      </>
    )
  }
}

export default Layout
