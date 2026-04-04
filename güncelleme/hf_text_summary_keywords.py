"""
Türkçe metin özeti ve anahtar terim çıkarımı — Hugging Face Inference API.

Ücretsiz kota:
  - https://huggingface.co/settings/tokens adresinden "Read" token oluşturun.
  - Ortam: HF_TOKEN veya HUGGING_FACE_HUB_TOKEN
  - Router API çoğu modelde token olmadan 401 verebilir.

Varsayılanlar:
  - Özet: csebuetnlp/mT5_multilingual_XLSum (Türkçe dahil çok dilli XLSum)
  - Anahtar terimler: akdeniz27/bert-base-turkish-cased-ner (adlandırılmış varlıklar:
    kişi, kurum, yer vb. — genel “konu” kelimeleri her zaman çıkmaz)

Daha hedefli Türkçe özet (sağlayıcı destekliyorsa):
  ozetle(metin, model=OZET_MODELI_TURKCE_MBART)
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Callable, List, Optional, TypeVar

from huggingface_hub import InferenceClient
from huggingface_hub.utils import HfHubHTTPError

T = TypeVar("T")

DEFAULT_OZET_MODELI = "csebuetnlp/mT5_multilingual_XLSum"
OZET_MODELI_TURKCE_MBART = "mukayese/mbart-large-turkish-summarization"

# Türkçe NER; Router’da token-classification sağlayıcısı tanımlı
DEFAULT_ANAHTAR_MODELI = "akdeniz27/bert-base-turkish-cased-ner"


@dataclass
class AnalyzeResult:
    """Özet metin ve çıkarılan terim listesi (NER öbekleri)."""

    summary: str
    keywords: List[str]


def _with_model_loading_retry(
    fn: Callable[[], T],
    retries: int = 4,
    wait_seconds: float = 12.0,
) -> T:
    last: Optional[Exception] = None
    for attempt in range(retries):
        try:
            return fn()
        except HfHubHTTPError as e:
            last = e
            code = getattr(e.response, "status_code", None)
            if code == 503 and attempt < retries - 1:
                time.sleep(wait_seconds)
                continue
            raise
    assert last is not None
    raise last


def _summarization_text(out: object) -> str:
    if out is None:
        return ""
    if isinstance(out, dict):
        return str(out.get("summary_text") or out.get("summary") or "")
    summary_text = getattr(out, "summary_text", None)
    if summary_text is not None:
        return str(summary_text)
    if isinstance(out, list) and out:
        return _summarization_text(out[0])
    return str(out)


def _el_score(el: object) -> float:
    if isinstance(el, dict):
        raw = el.get("score", 0)
    else:
        raw = getattr(el, "score", 0)
    try:
        return float(raw)
    except (TypeError, ValueError):
        return 0.0


def _el_entity_group(el: object) -> str:
    if isinstance(el, dict):
        return str(el.get("entity_group") or el.get("entity") or "")
    return str(getattr(el, "entity_group", None) or getattr(el, "entity", "") or "")


def _el_word(el: object) -> str:
    if isinstance(el, dict):
        w = el.get("word") or ""
    else:
        w = getattr(el, "word", None) or ""
    return str(w).replace("##", "").strip()


def _ner_etiket_tipi(etiket: str) -> str:
    e = etiket.strip().upper()
    if "-" in e:
        return e.split("-", 1)[-1]
    return e


def _ner_terimleri(
    tokens: List[object],
    min_score: float,
) -> List[str]:
    """Birleştirilmiş NER öbeklerini benzersiz sırayla döndürür."""
    gorduk: set[str] = set()
    sonuc: List[str] = []
    for el in tokens:
        if _el_score(el) < min_score:
            continue
        grup = _ner_etiket_tipi(_el_entity_group(el))
        if not grup or grup == "O":
            continue
        kelime = _el_word(el)
        if len(kelime) < 2:
            continue
        anahtar = kelime.casefold()
        if anahtar in gorduk:
            continue
        gorduk.add(anahtar)
        sonuc.append(kelime)
    return sonuc


class TurkceMetinAnaliz:
    """Türkçe özet + NER tabanlı anahtar terimler (Hugging Face Inference)."""

    def __init__(self, token: Optional[str] = None) -> None:
        tok = token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        self._client = InferenceClient(token=tok) if tok else InferenceClient()

    def ozetle(
        self,
        metin: str,
        *,
        model: str = DEFAULT_OZET_MODELI,
        max_uzunluk: int = 160,
        min_uzunluk: int = 24,
    ) -> str:
        metin = metin.strip()
        if not metin:
            return ""

        def call() -> object:
            return self._client.summarization(
                metin,
                model=model,
                generate_parameters={
                    "max_length": max_uzunluk,
                    "min_length": min_uzunluk,
                },
            )

        out = _with_model_loading_retry(call)
        return _summarization_text(out).strip()

    def anahtar_kelimeler(
        self,
        metin: str,
        *,
        model: str = DEFAULT_ANAHTAR_MODELI,
        min_guven: float = 0.45,
        max_karakter: int = 4000,
    ) -> List[str]:
        """Metindeki adlandırılmış varlık öbeklerini döndürür (NER)."""
        metin = metin.strip()
        if not metin:
            return []

        parca = metin[:max_karakter]

        def call() -> List[object]:
            return self._client.token_classification(
                parca,
                model=model,
                aggregation_strategy="simple",
            )

        ham = _with_model_loading_retry(call)
        return _ner_terimleri(ham, min_guven)

    def analiz_et(self, metin: str) -> AnalyzeResult:
        return AnalyzeResult(
            summary=self.ozetle(metin),
            keywords=self.anahtar_kelimeler(metin),
        )


def _ornek() -> None:
    if not (os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")):
        print(
            "Uyarı: HF_TOKEN tanımlı değil. PowerShell:\n"
            '  $env:HF_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"\n'
            "Adres: https://huggingface.co/settings/tokens (Read)\n"
        )

    uzun_metin = (
        "Yapay zekâ, son yıllarda doğal dil işleme ve bilgisayarlı görü alanlarında "
        "hızlı ilerleme kaydetti. İstanbul Teknik Üniversitesi’nde görevli Prof. Dr. Can Demir, "
        "büyük dil modellerinin metin özeti ve çeviri gibi görevlerde kullanıldığını belirtti. "
        "Hugging Face platformu, araştırmacıların bu modellere çıkarım API’leri üzerinden "
        "erişmesini kolaylaştırıyor. Ankara merkezli kurumlarda da benzer projeler yürütülüyor."
    )

    analiz = TurkceMetinAnaliz()
    try:
        sonuc = analiz.analiz_et(uzun_metin)
    except HfHubHTTPError as e:
        code = getattr(e.response, "status_code", None)
        if code == 401:
            print(
                "401 Unauthorized: Geçerli bir HF_TOKEN (Read) girin.\n"
                "https://huggingface.co/settings/tokens\n"
            )
            return
        raise

    print("--- Örnek Türkçe metin ---\n")
    print(uzun_metin[:500] + ("..." if len(uzun_metin) > 500 else ""), "\n")
    print("Özet:\n", sonuc.summary, "\n", sep="")
    print(
        "Anahtar terimler (NER — kişi, kurum, yer vb.):",
        ", ".join(sonuc.keywords) or "(tanınan varlık yok)",
    )
    print(
        "\nİpucu: Özeti güçlendirmek için (Router destekliyorsa):\n"
        f'  analiz.ozetle(metin, model="{OZET_MODELI_TURKCE_MBART}")'
    )


if __name__ == "__main__":
    _ornek()
