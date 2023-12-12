import axios, { AxiosResponse } from 'axios'

// Simulating the sleep function
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Simulating the httpx._exceptions.HTTPError class
export class HTTPError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HTTPError'
  }
}

// Simulating the unescape function
function unescape(text: string): string {
  // Replace &quot; with "
  return text.replace(/&quot;/g, '"')
}

// Simulating the re.sub function
function sub(pattern: RegExp, replacement: string, text: string): string {
  return text.replace(pattern, replacement)
}

// Simulating the unquote function
function unquote(url: string): string {
  return url // Simulating unquoting
}

const REGEX_STRIP_TAGS = /<[^>]*>/g

export type Image = {
  title: string
  image: string
  thumbnail: string
  url: string
  height: number
  width: number
  source: string
}

export type Text = {
  title: string
  href: string
  body: string
}

// Simulating the main class
export class SearchApi {
  private logger: Console

  constructor() {
    // Simulating the logger
    this.logger = console
  }

  async *images({
    keywords,
    region = 'wt-wt',
    safesearch = 'moderate',
    timelimit = null,
    size = null,
    color = null,
    type_image = null,
    layout = null,
    license_image = null,
    limit = 1,
  }: {
    keywords: string
    region?: string
    safesearch?: string
    timelimit?: string | null
    size?: string | null
    color?: string | null
    type_image?: string | null
    layout?: string | null
    license_image?: string | null
    limit?: number
  }): AsyncGenerator<Image> {
    if (!keywords) {
      throw new Error('Keywords are mandatory')
    }

    const vqd = await this._getVqd(keywords)
    if (!vqd) {
      throw new Error('Error in getting vqd')
    }

    const safesearchBase: { [key: string]: number } = {
      on: 1,
      moderate: 1,
      off: -1,
    }

    timelimit = timelimit ? `time:${timelimit}` : ''
    size = size ? `size:${size}` : ''
    color = color ? `color:${color}` : ''
    type_image = type_image ? `type:${type_image}` : ''
    layout = layout ? `layout:${layout}` : ''
    license_image = license_image ? `license:${license_image}` : ''

    const payload = {
      l: region,
      o: 'json',
      s: 0,
      q: keywords,
      vqd: vqd,
      f: `${timelimit},${size},${color},${type_image},${layout},${license_image}`,
      p: safesearchBase[safesearch.toLowerCase()],
    }

    const cache = new Set<string>()
    for (let _ = 0; _ < 1; _++) {
      const resp = await this._getUrl(
        'GET',
        'https://duckduckgo.com/i.js',
        payload,
      )

      if (!resp) {
        break
      }

      try {
        const respJson = resp.data
        const pageData = respJson.results
        if (!pageData) {
          break
        }

        let resultExists = false
        for (const row of pageData.slice(0, limit)) {
          const image_url = row.image
          if (image_url && !cache.has(image_url)) {
            cache.add(image_url)
            resultExists = true
            yield {
              title: row.title,
              image: this._normalizeUrl(image_url),
              thumbnail: this._normalizeUrl(row.thumbnail),
              url: this._normalizeUrl(row.url),
              height: row.height,
              width: row.width,
              source: row.source,
            }
          }
        }

        const next = respJson.next
        if (next) {
          payload.s = next.split('s=')[1].split('&')[0]
        }

        if (!next || !resultExists) {
          break
        }
      } catch (error) {
        break
      }
    }
  }

  async *text({
    keywords,
    region = 'wt-wt',
    safesearch = 'moderate',
    timelimit = null,
    limit = 5,
  }: {
    keywords: string
    region?: string
    safesearch?: string
    timelimit?: string | null
    limit?: number
  }): AsyncGenerator<Text> {
    if (!keywords) {
      throw new Error('Keywords are mandatory')
    }

    const vqd = await this._getVqd(keywords)
    if (!vqd) {
      throw new Error('Error in getting vqd')
    }

    const payload: Record<string, unknown> = {
      q: keywords,
      kl: region,
      l: region,
      s: 0,
      df: timelimit,
      vqd: vqd,
      o: 'json',
      sp: '0',
    }

    safesearch = safesearch.toLowerCase()
    if (safesearch === 'moderate') {
      payload.ex = '-1'
    } else if (safesearch === 'off') {
      payload.ex = '-2'
    } else if (safesearch === 'on') {
      payload.p = '1'
    }

    const cache = new Set<string>()
    // const searchPositions = ['0', '20', '70', '120']
    const searchPositions = ['0']
    for (const s of searchPositions) {
      payload.s = s
      const resp = await this._getUrl(
        'GET',
        'https://links.duckduckgo.com/d.js',
        payload,
      )

      if (!resp) {
        break
      }

      try {
        const pageData = resp.data.results

        if (!pageData) {
          break
        }

        let resultExists = false
        for (const row of pageData.slice(0, limit)) {
          const href = row.u
          if (
            href &&
            !cache.has(href) &&
            href !== `http://www.google.com/search?q=${keywords}`
          ) {
            cache.add(href)
            const body = this._normalize(row.a)
            if (body) {
              resultExists = true
              yield {
                title: this._normalize(row.t),
                href: this._normalizeUrl(href),
                body: body,
              }
            }
          }
        }

        if (!resultExists) {
          break
        }
      } catch (error) {
        break
      }
    }
  }

  private async _getUrl(
    method: string,
    url: string,
    params: { [key: string]: unknown },
  ): Promise<AxiosResponse | null> {
    for (let i = 0; i < 3; i++) {
      try {
        const resp = await axios.request({
          method,
          url,
          [method === 'GET' ? 'params' : 'data']: params,
        })
        if (this._is500InUrl(resp.config.url) || resp.status === 202) {
          throw new HTTPError('')
        }
        if (resp.status === 200) {
          return resp
        }
      } catch (e) {
        const ex = e as Error
        this.logger.error(`_getUrl() ${url} ${ex.name} ${ex.message}`)
        if (i >= 2 || ex.message.includes('418')) {
          throw ex
        }
      }
      await sleep(3000)
    }
    return null
  }

  private async _getVqd(keywords: string): Promise<string | null> {
    try {
      const resp = await this._getUrl('GET', 'https://duckduckgo.com', {
        q: keywords,
      })
      if (resp) {
        for (const [c1, c2] of [
          ['vqd="', '"'],
          ['vqd=', '&'],
          ["vqd='", "'"],
        ]) {
          try {
            const start = resp.data.indexOf(c1) + c1.length
            const end = resp.data.indexOf(c2, start)
            return resp.data.substring(start, end)
          } catch (error) {
            this.logger.error(`_getVqd() keywords=${keywords} vqd not found`)
          }
        }
      }
    } catch (error) {
      console.error('eyyy', error)
      // Handle error
    }
    return null
  }

  private _is500InUrl(url?: string): boolean {
    return url?.includes('500') || false
  }

  private _normalize(rawHtml: string | undefined): string {
    if (rawHtml) {
      return unescape(sub(REGEX_STRIP_TAGS, '', rawHtml))
    }
    return ''
  }

  private _normalizeUrl(url: string | undefined): string {
    if (url) {
      return unquote(url).replace(' ', '+')
    }
    return ''
  }
}
