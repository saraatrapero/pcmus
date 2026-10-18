from pcmus import hands as H


def test_grande_gana_la_mas_alta(cards):
    a = cards("12-oros", "12-copas", "4-oros", "5-oros")
    b = cards("12-bastos", "11-copas", "11-oros", "7-oros")
    assert H.grande_key(a) > H.grande_key(b)


def test_chica_gana_la_mas_baja(cards):
    a = cards("1-oros", "2-copas", "4-oros", "12-oros")  # dos ases
    b = cards("1-bastos", "4-copas", "4-bastos", "5-oros")
    assert H.chica_key(a) > H.chica_key(b)


def test_tipos_de_pares(cards):
    assert H.pares_type(cards("12-oros", "3-copas", "4-oros", "5-oros")) == H.PAR  # rey+tres
    assert H.pares_type(cards("7-oros", "7-copas", "7-bastos", "5-oros")) == H.MEDIAS
    assert H.pares_type(cards("7-oros", "7-copas", "5-bastos", "5-oros")) == H.DUPLES
    assert H.pares_type(cards("1-oros", "2-copas", "1-bastos", "2-oros")) == H.DUPLES  # cuatro ases
    assert H.pares_type(cards("1-oros", "4-copas", "5-bastos", "6-oros")) == H.PARES_NONE


def test_jerarquia_de_pares(cards):
    duples = cards("4-oros", "4-copas", "5-bastos", "5-oros")
    medias = cards("12-oros", "12-copas", "3-bastos", "5-oros")
    par_reyes = cards("12-oros", "3-copas", "6-bastos", "5-oros")
    par_sotas = cards("10-oros", "10-copas", "6-bastos", "5-oros")
    assert (
        H.pares_key(duples) > H.pares_key(medias) > H.pares_key(par_reyes) > H.pares_key(par_sotas)
    )


def test_orden_del_juego(cards):
    j31 = cards("12-oros", "11-copas", "10-bastos", "1-oros")
    j32 = cards("12-oros", "11-copas", "10-bastos", "2-oros")
    j32 = cards("12-oros", "11-copas", "5-bastos", "7-oros")
    j40 = cards("12-oros", "11-copas", "10-bastos", "3-oros")
    j33 = cards("12-oros", "11-copas", "6-bastos", "7-oros")
    assert H.points(j31) == 31 and H.points(j32) == 32
    assert H.points(j40) == 40 and H.points(j33) == 33
    assert H.juego_key(j31) > H.juego_key(j32) > H.juego_key(j40) > H.juego_key(j33)
    assert H.juego_value(j31) == 3 and H.juego_value(j40) == 2


def test_punto(cards):
    p30 = cards("12-oros", "11-copas", "6-bastos", "4-oros")
    p22 = cards("12-oros", "5-copas", "6-bastos", "1-oros")
    assert not H.has_juego(p30)
    assert H.punto_key(p30) > H.punto_key(p22)
