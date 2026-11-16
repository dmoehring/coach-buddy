package de.moehring.coach.buddy.backend.export.util;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CsvWriterTest {

    @Test
    void writesBomSemicolonSeparatedRowsWithCrLf() {
        byte[] bytes = new CsvWriter().row("Müller", "Jonas", 7).row("Weiß", null, 10).toBytes();

        assertArrayEquals(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}, Arrays.copyOf(bytes, 3));
        assertEquals(
                "Müller;Jonas;7\r\nWeiß;;10\r\n",
                new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8)
        );
    }

    @Test
    void quotesValuesWithSeparatorsQuotesAndLineBreaks() {
        assertEquals("\"a;b\"", CsvWriter.escape("a;b"));
        assertEquals("\"sagt \"\"hallo\"\"\"", CsvWriter.escape("sagt \"hallo\""));
        assertEquals("\"zeile1\nzeile2\"", CsvWriter.escape("zeile1\nzeile2"));
    }

    @Test
    void neutralizesSpreadsheetFormulas() {
        assertEquals("'=1+1", CsvWriter.escape("=1+1"));
        assertEquals("'@SUM(A1)", CsvWriter.escape("@SUM(A1)"));
        assertEquals("'-2+3+cmd", CsvWriter.escape("-2+3+cmd"));
    }

    @Test
    void keepsPhoneNumbersIntact() {
        assertEquals("+49 170 1234567", CsvWriter.escape("+49 170 1234567"));
        assertEquals("-12", CsvWriter.escape("-12"));
    }
}
