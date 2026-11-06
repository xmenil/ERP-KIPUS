import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Configura bordes XML en celdas para cumplir con APA 7 (sin bordes verticales)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for border_name, border_style in borders.items():
        if border_style:
            tag = f'w:{border_name}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), border_style.get('val', 'single'))
            element.set(qn('w:sz'), str(border_style.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), border_style.get('color', '000000'))
            tcBorders.append(element)
        else:
            tag = f'w:{border_name}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), 'none')
            tcBorders.append(element)
    tcPr.append(tcBorders)

def add_header_footer(doc):
    for s in doc.sections:
        footer = s.footer
        p = footer.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run = p.add_run("KIPU'S ERP — Manual de Procesos Operativos")
        run.font.name = 'Times New Roman'
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(128, 128, 128)

def create_apa7_document():
    doc = Document()
    
    # 1. Configuración de márgenes estándar APA 7 (1 pulgada = 2.54 cm en los 4 lados)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Configuración de estilos base (Times New Roman 12 pt)
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)
    normal_style.paragraph_format.line_spacing = 1.25
    normal_style.paragraph_format.space_after = Pt(6)

    # ----------------------------------------------------
    # PORTADA (Normas APA 7ma Edición - Formato Profesional)
    # ----------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(80)
    title_p.paragraph_format.space_after = Pt(18)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title_p.add_run("MANUAL DE FLUJOS OPERATIVOS Y MODELADO DE PROCESOS DE NEGOCIO: KIPU'S ERP")
    run_title.bold = True
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(16)

    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_after = Pt(120)
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = subtitle_p.add_run("Documentación de Arquitectura de Procesos bajo Estándar BPMN")
    run_sub.italic = True
    run_sub.font.name = 'Times New Roman'
    run_sub.font.size = Pt(12)

    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(6)
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_meta = meta_p.add_run("Darwin Nilver Córdova / Equipo de Desarrollo KIPU'S")
    run_meta.font.name = 'Times New Roman'
    run_meta.font.size = Pt(12)

    meta_inst = doc.add_paragraph()
    meta_inst.paragraph_format.space_after = Pt(6)
    meta_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_inst = meta_inst.add_run("KIPU'S Soluciones Tecnológicas — Sistema Integrado de Gestión Empresarial")
    run_inst.font.name = 'Times New Roman'
    run_inst.font.size = Pt(12)

    meta_date = doc.add_paragraph()
    meta_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_date = meta_date.add_run("Noviembre de 2026")
    run_date.font.name = 'Times New Roman'
    run_date.font.size = Pt(12)

    doc.add_page_break()

    # ----------------------------------------------------
    # RESUMEN EJECUTIVO (APA 7)
    # ----------------------------------------------------
    h_resumen = doc.add_paragraph()
    h_resumen.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h_resumen.paragraph_format.space_after = Pt(14)
    run_h_resumen = h_resumen.add_run("Resumen")
    run_h_resumen.bold = True
    run_h_resumen.font.name = 'Times New Roman'
    run_h_resumen.font.size = Pt(14)

    p_res = doc.add_paragraph()
    p_res.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_res.paragraph_format.space_after = Pt(12)
    p_res.add_run(
        "El presente manual documenta los once flujos operativos fundamentales que componen el sistema ERP "
        "KIPU'S, diseñados bajo el estándar de modelado de procesos de negocio BPMN (Business Process Model "
        "and Notation) y organizados según la jerarquía de roles de Dueño/Administrador, Almacenero y Cajero. "
        "La arquitectura del sistema consolida tareas comunes en flujos unificados para evitar duplicidades "
        "en la navegación, vincular las existencias físicas en almacén con el registro inmutable en Kardex y "
        "garantizar el cuadre de caja diario. Cada flujo incluye su respectivo diagrama gráfico codificado por colores, "
        "su justificación funcional y las reglas de negocio que gobiernan su ejecución."
    )

    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.space_after = Pt(24)
    run_kw_tag = p_kw.add_run("Palabras clave: ")
    run_kw_tag.italic = True
    p_kw.add_run("KIPU'S ERP, BPMN, diagramas de flujo, gestión de inventario, punto de venta, cuadre de caja.")

    # ----------------------------------------------------
    # SECCIÓN 1: INTRODUCCIÓN Y SEMÁNTICA VISUAL
    # ----------------------------------------------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(8)
    run_h1 = h1.add_run("1. Estándar Visual y Roles Operativos")
    run_h1.bold = True
    run_h1.font.name = 'Times New Roman'
    run_h1.font.size = Pt(13)

    p_intro = doc.add_paragraph()
    p_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_intro.add_run(
        "Los procesos se han modelado con cajas de alta legibilidad y una codificación semántica de "
        "colores basada en las mejores prácticas de Bizagi BPMN, orientada a una rápida comprensión ejecutiva:"
    )

    colores = [
        ("Verde:", "Inicio de procesos, aprobaciones, registros exitosos y emisión final de comprobantes o documentos."),
        ("Azul:", "Tareas operativas del usuario (aperturas de módulos, escaneo de productos, digitación de montos)."),
        ("Amarillo:", "Rombos de decisión condicional, verificaciones de existencias y alertas preventivas de reabastecimiento."),
        ("Morado:", "Operaciones de procesamiento automático del sistema KIPU'S (asientos en Kardex, actualización de caja, IA)."),
        ("Rojo:", "Eventos de excepción, rechazos por falta de existencias, mermas o descuadres de efectivo.")
    ]
    for tag, desc in colores:
        p_c = doc.add_paragraph(style='List Bullet')
        p_c.paragraph_format.space_after = Pt(3)
        r_tag = p_c.add_run(tag + " ")
        r_tag.bold = True
        p_c.add_run(desc)

    doc.add_page_break()

    # ----------------------------------------------------
    # SECCIÓN 2: DIAGRAMAS DE FLUJO (FIGURAS 1 A 11)
    # ----------------------------------------------------
    img_dir = r'd:\ERP-APP\docs\UML-flujos\imagenes'
    
    flujos = [
        {
            "num": 1,
            "title": "F01 - Monitoreo Ejecutivo y Acciones Rápidas (Inicio)",
            "fig_title": "Diagrama de flujo del panel de monitoreo y accesos rápidos de inicio",
            "img": "01_monitoreo_inicio.png",
            "roles": "Dueño / Administrador, Cajero, Almacenero.",
            "disparador": "Menú principal 'Inicio' (ruta raíz del ERP).",
            "desc": (
                "Sintetiza en tiempo real los indicadores críticos del negocio: ventas acumuladas del día, saldo "
                "líquido en caja chica y semáforo de existencias críticas. Permite ejecutar acciones operativas "
                "inmediatas mediante atajos directos sin navegar por menús secundarios."
            ),
            "max_w": 6.2,
            "max_h": 4.5
        },
        {
            "num": 2,
            "title": "F02 - Venta en Mostrador (POS)",
            "fig_title": "Diagrama de flujo del ciclo de venta en mostrador (POS)",
            "img": "02_venta_pos_completa.png",
            "roles": "Cajero, Dueño / Administrador.",
            "disparador": "Botón superior [+ Registrar venta] o módulo 'Ventas y caja'.",
            "desc": (
                "Gobierna la captura de productos por escáner de código de barras o búsqueda manual. "
                "Valida la disponibilidad de stock, aplica la forma de pago (efectivo, digital o mixto), "
                "descuenta existencias en el Kardex e ingresa el cobro a la caja en una única transacción atómica."
            ),
            "max_w": 5.4,
            "max_h": 4.8
        },
        {
            "num": 3,
            "title": "F03 - Turno y Cuadre de Caja",
            "fig_title": "Diagrama de flujo de apertura, arqueo y cierre de turno de caja",
            "img": "03_cuadre_caja_arqueo.png",
            "roles": "Cajero, Dueño / Administrador.",
            "disparador": "Botón [$ Cuadre de caja] o pestaña 'Caja' dentro de Ventas.",
            "desc": (
                "Controla la apertura del turno con fondo de sencillo, el registro continuo de ingresos por POS y "
                "el arqueo final al terminar la jornada. Compara el saldo físico contado contra el teórico del "
                "sistema, clasificando el cierre como Cuadrada o Con Diferencia (faltante/sobrante justificado)."
            ),
            "max_w": 4.8,
            "max_h": 4.9
        },
        {
            "num": 4,
            "title": "F04 - Cotizaciones y Devoluciones",
            "fig_title": "Diagrama de flujo de cotizaciones preventa y notas de crédito por devolución",
            "img": "04_cotizaciones_devoluciones.png",
            "roles": "Cajero, Dueño / Administrador.",
            "disparador": "Pestañas 'Cotizaciones' o 'Devoluciones' en el módulo de Ventas.",
            "desc": (
                "Modela el ciclo preventa para emisión de proformas convertibles a venta con un solo clic, "
                "así como el procedimiento de devoluciones con nota de crédito. Evalúa el estado del producto para "
                "reingresarlo al Kardex o clasificarlo como merma, afectando la caja en caso de reembolso monetario."
            ),
            "max_w": 6.2,
            "max_h": 4.6
        },
        {
            "num": 5,
            "title": "F05 - Alta de Producto en Inventario",
            "fig_title": "Diagrama de flujo de creación y escaneo de productos en inventario",
            "img": "05_inventario_escaner_catalogo.png",
            "roles": "Almacenero, Dueño / Administrador.",
            "disparador": "Menú 'Inventario' -> botones [Nuevo producto] o [Escanear].",
            "desc": (
                "Permite dar de alta artículos en catálogo validando códigos de barras y SKU para prevenir duplicados. "
                "Exige que el precio de venta supere al costo para garantizar margen comercial positivo, "
                "asigna el stock mínimo de reposición y genera el asiento inicial de entrada en el Kardex."
            ),
            "max_w": 5.8,
            "max_h": 4.8
        },
        {
            "num": 6,
            "title": "F06 - Kardex y Alertas de Stock",
            "fig_title": "Diagrama de flujo de actualización inmutable de Kardex y niveles de alerta",
            "img": "06_kardex_alertas_stock.png",
            "roles": "Almacenero, Dueño / Administrador.",
            "disparador": "Cualquier movimiento transaccional (Venta, Compra, Merma o Ajuste).",
            "desc": (
                "Registra cada variación física de mercadería de manera inmutable con fecha, tipo y usuario. "
                "Actualiza el semáforo de existencias en tres niveles: Óptimo (verde), Stock Bajo (amarillo, disparando "
                "la lista de reabastecimiento) y Agotado (rojo, emitiendo notificación crítica en el panel ejecutivo)."
            ),
            "max_w": 6.0,
            "max_h": 4.6
        },
        {
            "num": 7,
            "title": "F07 - Conteo Físico y Ajuste de Mermas",
            "fig_title": "Diagrama de flujo de auditoría de inventario físico y regularización de mermas",
            "img": "07_conteo_fisico_ajustes.png",
            "roles": "Almacenero, Dueño / Administrador.",
            "disparador": "Menú 'Inventario' -> pestañas 'Inventario físico' y 'Ajustes'.",
            "desc": (
                "Estandariza el conteo de artículos en anaquel contra el stock registrado en el sistema. "
                "En caso de faltantes, exige clasificar la merma (vencimiento, daño o pérdida) y asienta la salida "
                "en Kardex; ante sobrantes, regulariza la entrada con su respectivo justificativo operativo."
            ),
            "max_w": 6.0,
            "max_h": 4.6
        },
        {
            "num": 8,
            "title": "F08 - Sugerencia de Reabastecimiento",
            "fig_title": "Diagrama de flujo del algoritmo predictivo de sugerencias de compra",
            "img": "08_reabastecimiento_compras.png",
            "roles": "Dueño / Administrador.",
            "disparador": "Menú 'Compras y proveedores' -> pestaña o botón [Sugerencias].",
            "desc": (
                "Analiza la velocidad de venta de los últimos 30 días y los niveles de cobertura restantes para "
                "calcular automáticamente el volumen óptimo de compra a 30 días vista. Presenta la propuesta "
                "asociada al proveedor habitual y permite generar la Orden de Compra en estado Borrador."
            ),
            "max_w": 4.0,
            "max_h": 5.0
        },
        {
            "num": 9,
            "title": "F09 - Recepción de Mercadería",
            "fig_title": "Diagrama de flujo de recepción física de mercadería y control de comprobante",
            "img": "09_recepcion_mercaderia.png",
            "roles": "Almacenero, Dueño / Administrador.",
            "disparador": "Menú 'Compras' -> botón [Recepción de mercancía].",
            "desc": (
                "Valida la llegada del pedido confrontando los productos físicos contra la guía o factura del proveedor. "
                "Al confirmar la conformidad de cantidades y precios, eleva el stock disponible, actualiza el costo "
                "promedio ponderado en catálogo y cambia el estado de la orden a Recibida."
            ),
            "max_w": 5.0,
            "max_h": 5.0
        },
        {
            "num": 10,
            "title": "F10 - Control de Gastos y Clientes",
            "fig_title": "Diagrama de flujo de registro de gastos operativos y directorio de clientes",
            "img": "10_gastos_clientes.png",
            "roles": "Dueño / Administrador (ambos submódulos), Cajero (directorio de clientes).",
            "disparador": "Menú 'Gastos y clientes' (o 'Clientes' según el perfil activo).",
            "desc": (
                "Administra los egresos operativos (servicios, alquileres, fletes) deduciendo dinero de la gaveta de caja "
                "si el pago es en efectivo e impactando en la Utilidad Neta. En paralelo, gestiona el alta de clientes "
                "con validación de DNI (8 dígitos) o RUC (11 dígitos) con disponibilidad inmediata en el POS."
            ),
            "max_w": 6.0,
            "max_h": 4.6
        },
        {
            "num": 11,
            "title": "F11 - Reportes del Negocio, SUNAT y KIPU'S IA",
            "fig_title": "Diagrama de flujo de reportes financieros, balance SUNAT y consultas de IA",
            "img": "11_reportes_sunat_ia.png",
            "roles": "Dueño / Administrador (completo), Almacenero (reportes de existencias).",
            "disparador": "Menú 'Reportes' o botón [* KIPU'S IA] en Inicio.",
            "desc": (
                "Proporciona la visión global del rendimiento comercial: estado de resultados mensual (Utilidad Bruta "
                "y Neta), estimación de IGV tributario a liquidar ante SUNAT y descargas a hojas de cálculo. "
                "Incluye el asistente inteligente KIPU'S IA para diagnósticos 360 por texto o voz."
            ),
            "max_w": 6.2,
            "max_h": 4.4
        }
    ]

    h_sec2 = doc.add_paragraph()
    h_sec2.paragraph_format.space_before = Pt(8)
    h_sec2.paragraph_format.space_after = Pt(12)
    run_sec2 = h_sec2.add_run("2. Documentación Detallada de Flujos Operativos")
    run_sec2.bold = True
    run_sec2.font.name = 'Times New Roman'
    run_sec2.font.size = Pt(13)

    for fl in flujos:
        # Título de Flujo (Encabezado Nivel 2 APA 7)
        h_flujo = doc.add_paragraph()
        h_flujo.paragraph_format.space_before = Pt(10)
        h_flujo.paragraph_format.space_after = Pt(4)
        run_hf = h_flujo.add_run(fl["title"])
        run_hf.bold = True
        run_hf.font.name = 'Times New Roman'
        run_hf.font.size = Pt(12)

        # Ficha técnica concisa y precisa
        p_meta = doc.add_paragraph()
        p_meta.paragraph_format.space_after = Pt(4)
        r_r = p_meta.add_run("Roles intervinientes: ")
        r_r.bold = True
        p_meta.add_run(fl["roles"] + "  |  ")
        r_d = p_meta.add_run("Disparador: ")
        r_d.bold = True
        p_meta.add_run(fl["disparador"])

        p_desc = doc.add_paragraph()
        p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_desc.paragraph_format.space_after = Pt(10)
        p_desc.add_run(fl["desc"])

        # ----------------------------------------------------
        # FORMATO DE FIGURA APA 7MA EDICIÓN:
        # 1. Número de figura en negrita arriba
        # 2. Título de figura en cursiva debajo del número
        # 3. Gráfico centrado
        # 4. Nota descriptiva debajo con "Nota." en cursiva
        # ----------------------------------------------------
        p_fignum = doc.add_paragraph()
        p_fignum.paragraph_format.space_after = Pt(2)
        p_fignum.paragraph_format.keep_with_next = True
        r_fn = p_fignum.add_run(f"Figura {fl['num']}")
        r_fn.bold = True
        r_fn.font.name = 'Times New Roman'
        r_fn.font.size = Pt(11)

        p_figtitle = doc.add_paragraph()
        p_figtitle.paragraph_format.space_after = Pt(8)
        p_figtitle.paragraph_format.keep_with_next = True
        r_ft = p_figtitle.add_run(fl["fig_title"])
        r_ft.italic = True
        r_ft.font.name = 'Times New Roman'
        r_ft.font.size = Pt(11)

        # Inserción de Imagen con ajuste de dimensiones proporcionales
        img_path = os.path.join(img_dir, fl["img"])
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(6)
        p_img.paragraph_format.keep_with_next = True

        with Image.open(img_path) as im:
            orig_w, orig_h = im.size
            aspect = orig_h / orig_w
            
            target_w = fl["max_w"]
            target_h = target_w * aspect
            if target_h > fl["max_h"]:
                target_h = fl["max_h"]
                target_w = target_h / aspect
            
            p_img.add_run().add_picture(img_path, width=Inches(target_w), height=Inches(target_h))

        # Nota de Figura APA 7
        p_note = doc.add_paragraph()
        p_note.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_note.paragraph_format.space_after = Pt(16)
        r_nt = p_note.add_run("Nota. ")
        r_nt.italic = True
        r_nt.font.name = 'Times New Roman'
        r_nt.font.size = Pt(10)

        r_nt_body = p_note.add_run(
            f"El diagrama representa la secuencia lógica del proceso '{fl['title']}'. "
            "Las actividades en azul indican interacción del usuario, morado representa transacciones automatizadas "
            "del ERP, amarillo comisiones o validaciones y verde el desenlace exitoso. "
            "Elaboración propia a partir de la arquitectura funcional de KIPU'S ERP (2026)."
        )
        r_nt_body.font.name = 'Times New Roman'
        r_nt_body.font.size = Pt(10)

        # Salto de página para mantener cada figura en su página dedicada
        doc.add_page_break()

    # ----------------------------------------------------
    # SECCIÓN 3: TABLA DE TRAZABILIDAD (TABLA APA 7)
    # ----------------------------------------------------
    h_sec3 = doc.add_paragraph()
    h_sec3.paragraph_format.space_before = Pt(8)
    h_sec3.paragraph_format.space_after = Pt(6)
    run_sec3 = h_sec3.add_run("3. Matriz de Cobertura Funcional y Roles")
    run_sec3.bold = True
    run_sec3.font.name = 'Times New Roman'
    run_sec3.font.size = Pt(13)

    p_tnum = doc.add_paragraph()
    p_tnum.paragraph_format.space_after = Pt(2)
    r_tn = p_tnum.add_run("Tabla 1")
    r_tn.bold = True
    r_tn.font.name = 'Times New Roman'
    r_tn.font.size = Pt(11)

    p_ttitle = doc.add_paragraph()
    p_ttitle.paragraph_format.space_after = Pt(8)
    r_tt = p_ttitle.add_run("Matriz de trazabilidad de procesos KIPU'S ERP según roles de usuario")
    r_tt.italic = True
    r_tt.font.name = 'Times New Roman'
    r_tt.font.size = Pt(11)

    table = doc.add_table(rows=12, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    headers = ["Cód.", "Proceso Operativo", "Roles con Acceso", "Módulo / Ruta"]
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)

    # Filas de datos
    datos_tabla = [
        ("F01", "Monitoreo y Acciones Rápidas", "Admin, Cajero, Almacén", "Inicio (/dashboard)"),
        ("F02", "Venta en Mostrador (POS)", "Cajero, Admin", "Ventas y caja (/ventas)"),
        ("F03", "Turno y Cuadre de Caja", "Cajero, Admin", "Ventas y caja -> Caja"),
        ("F04", "Cotizaciones y Devoluciones", "Cajero, Admin", "Ventas y caja -> Cotizaciones"),
        ("F05", "Alta de Producto en Catálogo", "Almacenero, Admin", "Inventario (/inventario)"),
        ("F06", "Kardex y Alertas de Stock", "Almacenero, Admin", "Inventario -> Movimientos"),
        ("F07", "Conteo Físico y Mermas", "Almacenero, Admin", "Inventario -> Físico / Ajustes"),
        ("F08", "Sugerencia de Reabastecimiento", "Dueño / Administrador", "Compras (/compras)"),
        ("F09", "Recepción de Mercadería", "Almacenero, Admin", "Compras -> Recepción"),
        ("F10", "Gastos y Directorio de Clientes", "Admin (ambos), Cajero (clientes)", "Gastos y clientes (/gastos)"),
        ("F11", "Reportes, SUNAT y KIPU'S IA", "Admin (total), Almacén (stock)", "Reportes (/reportes) / IA")
    ]

    for row_idx, data in enumerate(datos_tabla, start=1):
        row_cells = table.rows[row_idx].cells
        for col_idx, text in enumerate(data):
            row_cells[col_idx].text = text
            p = row_cells[col_idx].paragraphs[0]
            if col_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)

    # Aplicar formato de bordes APA 7 a la tabla:
    # Línea superior e inferior en cabecera, línea inferior al final, sin líneas verticales.
    border_black = {'val': 'single', 'sz': 8, 'color': '000000'}
    for cell in table.rows[0].cells:
        set_cell_borders(cell, top=border_black, bottom=border_black)
    
    for row in table.rows[1:-1]:
        for cell in row.cells:
            set_cell_borders(cell)  # Sin bordes intermedios

    for cell in table.rows[-1].cells:
        set_cell_borders(cell, bottom=border_black)

    # Nota de tabla APA 7
    p_tnote = doc.add_paragraph()
    p_tnote.paragraph_format.space_before = Pt(6)
    p_tnote.paragraph_format.space_after = Pt(20)
    r_tnt = p_tnote.add_run("Nota. ")
    r_tnt.italic = True
    r_tnt.font.name = 'Times New Roman'
    r_tnt.font.size = Pt(10)
    r_tnt_body = p_tnote.add_run(
        "Las rutas especificadas corresponden a la estructura de navegación consolidada del ERP. "
        "El acceso se restringe a nivel de interfaz y servicio según las credenciales del usuario autenticado. "
        "Fuente: Matriz de permisos de KIPU'S ERP (2026)."
    )
    r_tnt_body.font.name = 'Times New Roman'
    r_tnt_body.font.size = Pt(10)

    # ----------------------------------------------------
    # SECCIÓN 4: REFERENCIAS (APA 7)
    # ----------------------------------------------------
    h_ref = doc.add_paragraph()
    h_ref.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h_ref.paragraph_format.space_before = Pt(16)
    h_ref.paragraph_format.space_after = Pt(12)
    run_href = h_ref.add_run("Referencias")
    run_href.bold = True
    run_href.font.name = 'Times New Roman'
    run_href.font.size = Pt(13)

    referencias = [
        "American Psychological Association. (2020). Publication manual of the American Psychological Association (7th ed.). https://doi.org/10.1037/0000165-000",
        "Object Management Group. (2013). Business Process Model and Notation (BPMN), Version 2.0.2. https://www.omg.org/spec/BPMN/2.0.2/",
        "PlantUML Authors. (2024). PlantUML Language Reference Guide. https://plantuml.com/",
        "Superintendencia Nacional de Aduanas y de Administración Tributaria. (2024). Guía técnica de emisión electrónica y comprobantes de pago. SUNAT."
    ]

    for ref in referencias:
        p_r = doc.add_paragraph()
        p_r.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_r.paragraph_format.left_indent = Inches(0.5)
        p_r.paragraph_format.first_line_indent = Inches(-0.5)  # Sangría francesa APA 7
        p_r.paragraph_format.space_after = Pt(8)
        r = p_r.add_run(ref)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)

    add_header_footer(doc)

    out_file = r'd:\ERP-APP\docs\UML-flujos\KIPUS_ERP_Manual_Flujos_Operativos_APA7.docx'
    doc.save(out_file)
    print(f"Documento guardado exitosamente en: {out_file}")

    # Copia de conveniencia en docs/
    out_file_docs = r'd:\ERP-APP\docs\KIPUS_ERP_Manual_Flujos_Operativos_APA7.docx'
    doc.save(out_file_docs)
    print(f"Copia guardada en: {out_file_docs}")

if __name__ == '__main__':
    create_apa7_document()

