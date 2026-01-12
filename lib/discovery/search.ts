/**
 * Search for competitor candidates using Google Custom Search API
 * Cost: ~$0.005 per search (100 free/day, then $5/1000)
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export async function searchGoogleCustom(
  industry: string,
  city: string,
  state: string,
  zipcode?: string
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error('Google Custom Search API not configured');
  }

  // Build multiple search queries for better coverage
  const queries = [
    `${industry} in ${city}, ${state}`,
    zipcode ? `${industry} near ${zipcode}` : null,
    `best ${industry} ${city}`,
  ].filter(Boolean) as string[];

  const allResults: SearchResult[] = [];

  try {
    // Execute searches in parallel
    const searchPromises = queries.map(async (query) => {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('cx', searchEngineId);
      url.searchParams.set('q', query);
      url.searchParams.set('num', '10'); // Results per query

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`Search failed for query: ${query}`, await response.text());
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || '',
        displayLink: item.displayLink || new URL(item.link).hostname,
      }));
    });

    const results = await Promise.all(searchPromises);
    allResults.push(...results.flat());

    // Remove duplicates by domain
    const uniqueByDomain = Array.from(
      new Map(
        allResults.map((r) => {
          try {
            const hostname = new URL(r.link).hostname;
            return [hostname, r];
          } catch {
            return [r.link, r];
          }
        })
      ).values()
    );

    return uniqueByDomain;
  } catch (error) {
    console.error('Google Custom Search error:', error);
    throw new Error('Failed to search for competitors');
  }
}

/**
 * Alternative: Bing Search API (cheaper option)
 * Cost: $3/1000 transactions
 */
export async function searchBing(
  industry: string,
  city: string,
  state: string
): Promise<SearchResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error('Bing Search API not configured');
  }

  const query = `${industry} in ${city}, ${state}`;

  try {
    const url = new URL('https://api.bing.microsoft.com/v7.0/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', '20');
    url.searchParams.set('mkt', 'en-US');

    const response = await fetch(url.toString(), {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Bing search failed');
    }

    const data = await response.json();

    return (data.webPages?.value || []).map((r: any) => ({
      title: r.name,
      link: r.url,
      snippet: r.snippet || '',
      displayLink: new URL(r.url).hostname,
    }));
  } catch (error) {
    console.error('Bing Search error:', error);
    throw new Error('Failed to search for competitors');
  }
}
