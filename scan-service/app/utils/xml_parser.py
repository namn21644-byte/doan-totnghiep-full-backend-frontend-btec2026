import re
from xml.etree import ElementTree as ET

DOCTYPE_PATTERN = re.compile(r'<!DOCTYPE[^>]*>')


def clean_xml(xml_text):
    """Loại bỏ khai báo DOCTYPE - nguyên nhân phổ biến khiến ElementTree.fromstring()
    ném lỗi parse với output XML do một số phiên bản Nmap sinh ra."""
    return DOCTYPE_PATTERN.sub('', xml_text)


def parse_nmap_xml(xml_text):
    cleaned = clean_xml(xml_text)
    root = ET.fromstring(cleaned)

    hosts_result = []

    for host_el in root.findall('host'):
        status_el = host_el.find('status')
        host_status = status_el.get('state') if status_el is not None else 'unknown'

        address_el = host_el.find('address')
        host_ip = address_el.get('addr') if address_el is not None else None

        ports_result = []
        ports_el = host_el.find('ports')

        if ports_el is not None:
            for port_el in ports_el.findall('port'):
                port_number = int(port_el.get('portid'))
                protocol = port_el.get('protocol')

                state_el = port_el.find('state')
                state = state_el.get('state') if state_el is not None else 'unknown'

                # QUAN TRỌNG: không dùng cờ --open của Nmap khi scan (có thể làm
                # thiếu host trong kết quả). Thay vào đó lấy toàn bộ port trả về
                # rồi TỰ LỌC "open" ngay tại đây, ở tầng parsing.
                if state != 'open':
                    continue

                service_el = port_el.find('service')
                service_name = service_el.get('name', '') if service_el is not None else ''
                product = service_el.get('product', '') if service_el is not None else ''
                version = service_el.get('version', '') if service_el is not None else ''

                ports_result.append({
                    'port': port_number,
                    'protocol': protocol,
                    'state': state,
                    'service': service_name,
                    'product': product,
                    'version': version
                })

        os_el = host_el.find('os')
        os_guess = ''
        if os_el is not None:
            osmatch_el = os_el.find('osmatch')
            if osmatch_el is not None:
                os_guess = osmatch_el.get('name', '')

        hosts_result.append({
            'hostIp': host_ip,
            'hostStatus': host_status,
            'ports': ports_result,
            'osGuess': os_guess
        })

    return hosts_result
