import { runPython } from "./_bridge.mjs";

class NeuralForgeTestTool {
  constructor() {
    this.name = "neuralforge_test";
  }

  async execute(params) {
    const suite = params.suite || params.test || params._raw || "all";
    const epochs = params.epochs || 30;

    const code = `
import sys, json, time, numpy as np, torch
sys.path.insert(0, r"C:\\Users\\jacks\\OneDrive\\Desktop\\agnt-evo\\neuralforge")
from neuralforge.learner import DataLearner
from neuralforge.pattern_engine import PatternEngine
from neuralforge.evaluation.quality_predictor import ModelQualityPredictor

results = {}
suite = "${suite}"
epochs = ${epochs}

# ── DataLearner Tests ──
if suite in ["all", "learner", "data"]:
    # Regression
    np.random.seed(42)
    X = np.random.randn(200, 5).tolist()
    y = [3*x[0]+2*x[1]+np.random.normal(0,0.3) for x in X]
    dl = DataLearner(device=torch.device("cpu"))
    t0 = time.time()
    r = dl.learn(X, y, epochs=epochs)
    results["learner_regression"] = {"status": r.get("status"), "metric": r.get("metric_value"), "time": round(time.time()-t0,2), "pattern": r.get("problem_type"), "arch": r.get("architecture")}

    # Classification
    np.random.seed(123)
    n=150
    X = np.vstack([np.random.randn(n//3,2)+[2,2],np.random.randn(n//3,2)+[-2,-2],np.random.randn(n//3,2)+[2,-2]]).tolist()
    y = [0]*(n//3)+[1]*(n//3)+[2]*(n//3)
    dl2 = DataLearner(device=torch.device("cpu"))
    t0 = time.time()
    r = dl2.learn(X, y, epochs=epochs)
    results["learner_classification"] = {"status": r.get("status"), "metric": r.get("metric_value"), "time": round(time.time()-t0,2), "pattern": r.get("problem_type"), "arch": r.get("architecture")}

    # Forecasting
    data = [float(np.sin(2*np.pi*i/20)) for i in range(100)]
    X = [[data[i]] for i in range(80)]
    y = [float(data[i+1]) for i in range(80)]
    dl3 = DataLearner(device=torch.device("cpu"))
    t0 = time.time()
    r = dl3.learn(X, y, epochs=epochs)
    results["learner_forecasting"] = {"status": r.get("status"), "metric": r.get("metric_value"), "time": round(time.time()-t0,2), "pattern": r.get("problem_type"), "arch": r.get("architecture")}

    # Anomaly
    np.random.seed(99)
    X = np.random.randn(190,3).tolist() + (np.random.randn(10,3)*5).tolist()
    y = [0]*190+[1]*10
    dl4 = DataLearner(device=torch.device("cpu"))
    t0 = time.time()
    r = dl4.learn(X, y, epochs=epochs)
    results["learner_anomaly"] = {"status": r.get("status"), "metric": r.get("metric_value"), "time": round(time.time()-t0,2), "pattern": r.get("problem_type"), "arch": r.get("architecture")}

# ── Pattern Engine Tests ──
if suite in ["all", "pattern", "time_series"]:
    pe = PatternEngine()

    data = [2.0*i+np.random.normal(0,0.5) for i in range(50)]
    t0 = time.time()
    r = pe.analyze(data, predict_steps=5, epochs=epochs)
    results["pattern_trend"] = {"status": r.get("status"), "corr": r.get("training_correlation"), "time": round(time.time()-t0,2), "pattern": r.get("pattern_type"), "arch": r.get("architecture")}

    data = [10.0*np.sin(2*np.pi*i/12)+np.random.normal(0,0.3) for i in range(60)]
    t0 = time.time()
    r = pe.analyze(data, predict_steps=5, epochs=epochs)
    results["pattern_seasonal"] = {"status": r.get("status"), "corr": r.get("training_correlation"), "time": round(time.time()-t0,2), "pattern": r.get("pattern_type"), "arch": r.get("architecture")}

    np.random.seed(42)
    data = [100.0]
    for _ in range(99): data.append(data[-1]+np.random.normal(0,1)-0.1*(data[-1]-100))
    t0 = time.time()
    r = pe.analyze(data, predict_steps=5, epochs=epochs)
    results["pattern_stationary"] = {"status": r.get("status"), "corr": r.get("training_correlation"), "time": round(time.time()-t0,2), "pattern": r.get("pattern_type"), "arch": r.get("architecture")}

    data = list(np.random.normal(5,0.5,30))+list(np.random.normal(15,0.5,30))
    t0 = time.time()
    r = pe.analyze(data, predict_steps=5, epochs=epochs)
    results["pattern_step"] = {"status": r.get("status"), "corr": r.get("training_correlation"), "time": round(time.time()-t0,2), "pattern": r.get("pattern_type"), "arch": r.get("architecture")}

    x=0.3; data=[]
    for _ in range(100):
        x=3.9*x*(1-x)
        data.append(x+np.random.normal(0,0.01))
    t0 = time.time()
    r = pe.analyze(data, predict_steps=5, epochs=epochs)
    results["pattern_chaotic"] = {"status": r.get("status"), "corr": r.get("training_correlation"), "time": round(time.time()-t0,2), "pattern": r.get("pattern_type"), "arch": r.get("architecture")}

# ── Quality Predictor Test ──
if suite in ["all", "quality", "predictor"]:
    predictor = ModelQualityPredictor(use_multi_objective=True)
    histories, ta, tl, tm, am = [],[],[],[],[]
    for i,w in enumerate([16,32,64,128]):
        np.random.seed(i+100)
        bl=np.random.uniform(1.5,2.5); d=np.random.uniform(0.1,0.4)
        n=np.random.normal(0,0.03,10)
        histories.append({"train_loss":list(bl*np.exp(-d*np.linspace(0,3,10))+n),
                          "val_loss":list(bl*1.1*np.exp(-d*0.9*np.linspace(0,3,10))+np.random.normal(0,0.04,10)),
                          "lr":list(np.linspace(0.001,0.0001,10))})
        ta.append(float(np.random.uniform(0.5,0.95)))
        tl.append(min(1.0,(2.0+w*0.05)/50.0))
        tm.append(min(1.0,(w*0.5)/200.0))
        am.append({"num_params":w*w*6+w*2*10,"depth":2+i,"width":w,"num_classes":10})
    t0 = time.time()
    m = predictor.train_on_histories(histories, ta, tl, tm, am, ["image_classification"]*4, ["cnn"]*4, epochs=100)
    results["quality_predictor"] = {"acc_corr": round(m["accuracy_corr"],4), "lat_corr": round(m["latency_corr"],4), "mem_corr": round(m["memory_corr"],4), "time": round(time.time()-t0,2)}

# ── Summary ──
all_ok = all(v.get("status")=="success" for k,v in results.items() if k!="summary")
results["_summary"] = {"total": len([k for k in results if not k.startswith("_")]), "passed": sum(1 for k,v in results.items() if not k.startswith("_") and v.get("status")=="success"), "all_pass": all_ok, "suite": suite}

print("NF_TEST_RESULT:" + json.dumps(results, default=str))
`;
    const result = runPython(code, 180000);
    if (result.status === "error") return { error: result.error };
    return result;
  }
}

export default new NeuralForgeTestTool();
