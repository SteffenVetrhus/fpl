"""Tests for MHT/MHTML parsing in the FBRef scraper."""

from __future__ import annotations

import email.mime.multipart
import email.mime.text
import textwrap

import pytest

from src.fbref import _extract_html_from_mht, _read_html


SAMPLE_HTML = textwrap.dedent("""\
    <html><body>
    <table id="stats_possession"><tbody>
    <tr><th data-stat="player">Saka</th><td data-stat="team">Arsenal</td>
    <td data-stat="progressive_carries">42</td></tr>
    </tbody></table>
    </body></html>
""")


def _build_mht_bytes(html: str, content_type: str = "text/html") -> bytes:
    """Build a minimal multipart MHT archive containing the given HTML."""
    msg = email.mime.multipart.MIMEMultipart("related")
    part = email.mime.text.MIMEText(html, "html", "utf-8")
    msg.attach(part)
    return msg.as_bytes()


def _build_single_part_mht(html: str) -> bytes:
    """Build a single-part MHT (no multipart boundary)."""
    part = email.mime.text.MIMEText(html, "html", "utf-8")
    return part.as_bytes()


class TestExtractHtmlFromMht:
    def test_multipart_mht(self):
        raw = _build_mht_bytes(SAMPLE_HTML)
        result = _extract_html_from_mht(raw)
        assert "stats_possession" in result
        assert "Saka" in result

    def test_single_part_mht(self):
        raw = _build_single_part_mht(SAMPLE_HTML)
        result = _extract_html_from_mht(raw)
        assert "stats_possession" in result
        assert "Saka" in result

    def test_empty_mht_raises(self):
        raw = b"From: test\nContent-Type: application/octet-stream\n\n"
        with pytest.raises(ValueError, match="Could not extract HTML"):
            _extract_html_from_mht(raw)


class TestReadHtmlWithMht:
    def test_prefers_mht_over_html(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.fbref.DATA_DIR", tmp_path)
        (tmp_path / "possession.html").write_text("<html>html version</html>")
        (tmp_path / "possession.mht").write_bytes(
            _build_mht_bytes("<html>mht version</html>")
        )
        result = _read_html("possession")
        assert "mht version" in result

    def test_falls_back_to_html(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.fbref.DATA_DIR", tmp_path)
        (tmp_path / "possession.html").write_text("<html>html only</html>")
        result = _read_html("possession")
        assert "html only" in result

    def test_reads_mhtml_extension(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.fbref.DATA_DIR", tmp_path)
        (tmp_path / "gca.mhtml").write_bytes(
            _build_mht_bytes("<html>mhtml file</html>")
        )
        result = _read_html("gca")
        assert "mhtml file" in result

    def test_missing_file_raises(self, tmp_path, monkeypatch):
        monkeypatch.setattr("src.fbref.DATA_DIR", tmp_path)
        with pytest.raises(FileNotFoundError, match="Missing data file"):
            _read_html("possession")
