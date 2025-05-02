from fastapi import FastAPI, Body
from pydantic import BaseModel
import pandas as pd
import traceback, sys, io

app = FastAPI()

# 读取 Excel 并处理列名空格
df = pd.read_excel("Financial Sample.xlsx")
df.columns = df.columns.str.strip()

# 输入数据结构
class ToolRequest(BaseModel):
    tool: str
    args: dict

# 单个 Tool 执行器
def exec_pandas_code(code: str) -> str:
    old_stdout = sys.stdout
    mystdout = io.StringIO()
    sys.stdout = mystdout

    # safe_globals = {
    #     "df": df,
    #     "pd": pd,
    #     "__builtins__": {
    #         "print": print,
    #         "len": len,
    #         "range": range,
    #         "str": str,
    #         "int": int,
    #         "float": float,
    #         "min": min,
    #         "max": max,
    #         "sum": sum,
    #     }
    # }

    try:
        exec(code)
        return mystdout.getvalue().strip() or "[\u65e0\u8f93\u51fa]"
    except Exception:
        return traceback.format_exc()
    finally:
        sys.stdout = old_stdout

# 简化协议 HTTP 调用入口
@app.post("/tools/use")
def use_tool(req: ToolRequest):
    if req.tool == "exec_pandas_code":
        code = req.args.get("code", "")
        output = exec_pandas_code(code)
        return {"status": "success", "result": output}
    else:
        return {"status": "error", "result": f"Tool {req.tool} not found"}

# 启动方式：
# uvicorn main:app --host 0.0.0.0 --port 5001

"""
➜  ~ curl -s -X POST http://localhost:5001/tools/use \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "exec_pandas_code",
    "args": {
      "code": "print(df.head())"
    }
  }' | jq -r '.result'
Segment  Country    Product  ... Month Number  Month Name  Year
0  Government   Canada  Carretera  ...            1     January  2014
1  Government  Germany  Carretera  ...            1     January  2014
2   Midmarket   France  Carretera  ...            6        June  2014
3   Midmarket  Germany  Carretera  ...            6        June  2014
4   Midmarket   Mexico  Carretera  ...            6        June  2014

[5 rows x 16 columns]
"""