from pathlib import Path
import shutil
from datetime import datetime
import sys

api = Path("app/api/[...path]/route.ts")
page = Path("app/page.tsx")
a = api.read_text()
p = page.read_text()

old_api = """    const actor=await requirePermission('products.manage'),b=await bodyJson(req),id=String(b.id||'');
    const priceRub = b.price_rub_kopecks !== undefined ? Number(b.price_rub_kopecks) : null;
    const priceHp = b.price_hp !== undefined ? Number(b.price_hp) : null;
    const discount=Number(b.discount_percent),stock=b.stock===null?null:Number(b.stock);
    if((priceRub !== null && (!Number.isSafeInteger(priceRub) || priceRub < 0)) ||
       (priceHp !== null && (!Number.isSafeInteger(priceHp) || priceHp < 0)) ||
       !Number.isInteger(discount) || discount < 0 || discount > 100) {
      throw new HttpError(400,'Некорректная цена или скидка');
    }
    const active=b.active===undefined?null:Boolean(b.active);
    const rows = active === null
      ? await db`UPDATE products SET price_rub_kopecks=COALESCE(${priceRub}, price_rub_kopecks), price_hp=COALESCE(${priceHp}, price_hp), discount_percent=${discount}, stock=${stock} WHERE id=${id} RETURNING id,name,price_rub_kopecks,price_hp,discount_percent,stock,active,store`
      : await db`UPDATE products SET price_rub_kopecks=COALESCE(${priceRub}, price_rub_kopecks), price_hp=COALESCE(${priceHp}, price_hp), discount_percent=${discount}, stock=${stock}, active=${active} WHERE id=${id} RETURNING id,name,price_rub_kopecks,price_hp,discount_percent,stock,active,store`;"""

new_api = """    const actor=await requirePermission('products.manage'),b=await bodyJson(req),id=String(b.id||'');
    const priceRub = b.price_rub_kopecks !== undefined ? Number(b.price_rub_kopecks) : null;
    const priceHp = b.price_hp !== undefined ? Number(b.price_hp) : null;
    const discount=Number(b.discount_percent),stock=b.stock===null?null:Number(b.stock);
    const name=b.name===undefined?null:String(b.name).trim().slice(0,150);
    const description=b.description===undefined?null:String(b.description).trim().slice(0,5000);
    if((priceRub !== null && (!Number.isSafeInteger(priceRub) || priceRub < 0)) ||
       (priceHp !== null && (!Number.isSafeInteger(priceHp) || priceHp < 0)) ||
       !Number.isInteger(discount) || discount < 0 || discount > 100 ||
       (name !== null && !name)) {
      throw new HttpError(400,'Некорректное название, цена или скидка');
    }
    const active=b.active===undefined?null:Boolean(b.active);
    const rows = active === null
      ? await db`UPDATE products SET name=COALESCE(${name},name), description=COALESCE(${description},description), price_rub_kopecks=COALESCE(${priceRub}, price_rub_kopecks), price_hp=COALESCE(${priceHp}, price_hp), discount_percent=${discount}, stock=${stock} WHERE id=${id} RETURNING id,name,description,price_rub_kopecks,price_hp,discount_percent,stock,active,store`
      : await db`UPDATE products SET name=COALESCE(${name},name), description=COALESCE(${description},description), price_rub_kopecks=COALESCE(${priceRub}, price_rub_kopecks), price_hp=COALESCE(${priceHp}, price_hp), discount_percent=${discount}, stock=${stock}, active=${active} WHERE id=${id} RETURNING id,name,description,price_rub_kopecks,price_hp,discount_percent,stock,active,store`;"""

old_payload = "body:JSON.stringify({id:p.id,[p.store==='staff'?'price_hp':'price_rub_kopecks']:price,discount_percent:discount,stock,active:Boolean(p.active)})"
new_payload = "body:JSON.stringify({id:p.id,name:p.name,description:p.description,[p.store==='staff'?'price_hp':'price_rub_kopecks']:price,discount_percent:discount,stock,active:Boolean(p.active)})"

old_editor = """<h3>{p.name}</h3>
<p className="tiny">{p.store} · {p.category} · {p.store==='staff'?'HP':'RUB'}</p>
<label>{p.store==='staff'?'Цена в HP':'Цена в копейках'}"""

new_editor = """<h3>{p.name}</h3>
<p className="tiny">{p.store} · {p.category} · {p.store==='staff'?'HP':'RUB'}</p>
<label>Название товара
<input type="text" maxLength={150} value={p.name??''}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,name:e.target.value}:x))}/>
</label>
<label>Описание товара
<textarea maxLength={5000} value={p.description??''}
onChange={e=>setItems(old=>old.map(x=>x.id===p.id?{...x,description:e.target.value}:x))}/>
</label>
<label>{p.store==='staff'?'Цена в HP':'Цена в копейках'}"""

checks = [
    (old_api in a, "Не совпал API PATCH товаров"),
    (old_payload in p, "Не найден payload сохранения товара"),
    (old_editor in p, "Не найден блок редактора товара"),
]
for ok, message in checks:
    if not ok:
        print("ОШИБКА:", message)
        print("Файлы не изменены этим скриптом.")
        sys.exit(1)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
shutil.copy2(api, f"{api}.bak-editor-{stamp}")
shutil.copy2(page, f"{page}.bak-editor-{stamp}")

api.write_text(a.replace(old_api, new_api, 1))
page.write_text(p.replace(old_payload, new_payload, 1).replace(old_editor, new_editor, 1))
print("OK: добавлены поля названия и описания.")
print("OK: API сохраняет название и описание в базе.")
print("Резервные копии созданы.")
