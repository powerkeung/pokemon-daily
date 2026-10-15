#!/usr/bin/env python3
"""驗證產品購買/參加連結的 HTTP 狀態"""

import urllib.request
import urllib.error
import json
from typing import Dict, List, Tuple

# 定義需要檢查的 URL
urls_to_check = {
    "ライスクッキー": {
        "PCO搜索頁": "https://www.pokemoncenter-online.com/?main_page=product_list&sort=new&keyword=Pokemon_Yurutto",
    },
    "30th CELEBRATION カードセット": {
        "楽天ブックス 9種セット": "https://books.rakuten.co.jp/rb/18595457/",
        "Lawson 公告": "https://www.lawson.co.jp/lab/entertainment/art/20261006_toypokemon.html",
        "30周年商品頁": "https://www.30th.pokemon-card.com/product/cardset",
    },
    "コレクションファイルプレミアム": {
        "30周年商品頁": "https://www.30th.pokemon-card.com/product/goods-06",
    },
    "Pokémon × Beats Pill": {
        "Apple商品頁": "https://www.apple.com/shop/product/mkfn4ll/a/beats-pill-pok%C3%A9mon-special-edition",
        "Target商品頁": "https://www.target.com/p/beats-pokemon-pill-wireless-bluetooth-speaker/-/A-1013099514",
    },
    "お前、もしかしてロケット団？": {
        "官方特設頁": "https://www.pokemon.co.jp/ex/omaroke/",
    },
}

def check_url(url: str, max_redirects: int = 5) -> Tuple[int, str]:
    """
    檢查 URL 的 HTTP 狀態碼
    返回: (狀態碼, 最終 URL)
    """
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, response.url
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception as e:
        return 0, f"錯誤: {str(e)}"

def main():
    results = []
    
    print("=" * 80)
    print("驗證產品購買/參加連結")
    print("=" * 80)
    
    for product, channels in urls_to_check.items():
        print(f"\n【{product}】")
        for channel, url in channels.items():
            status, final_url = check_url(url)
            
            if status == 200:
                status_text = "✅ 200 OK"
            elif status == 403:
                status_text = "⚠️ 403 禁止訪問（可能是官方bot防護）"
            elif status == 404:
                status_text = "❌ 404 未找到"
            elif status == 410:
                status_text = "❌ 410 已刪除"
            else:
                status_text = f"⚠️ {status}"
            
            print(f"  {channel}: {status_text}")
            print(f"    URL: {url}")
            
            results.append({
                "product": product,
                "channel": channel,
                "url": url,
                "status": status,
                "status_text": status_text,
                "final_url": final_url if final_url != url else None
            })
    
    # 保存結果到 JSON 文件
    with open('/workspace/url_verification_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 80)
    print("驗證完成！結果已保存到 url_verification_results.json")
    print("=" * 80)

if __name__ == "__main__":
    main()
