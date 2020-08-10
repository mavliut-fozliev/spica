import {Event} from "@spica-server/function/queue/proto";
import * as grpc from "@grpc/grpc-js";
import * as uniqid from "uniqid";
import * as util from "util";
import {Queue} from "./queue";

export class EventQueue {
  private server: grpc.Server;
  private queue = new Map<string, Event.Event>();

  private _next = new Array<(event: Event.Event) => void>();

  get size(): number {
    return this.queue.size;
  }

  constructor(
    private _enqueueCallback: (event: Event.Event) => void,
    private _popCallback: (event: Event.Event, worker: string) => void
  ) {
    this._create();
  }

  private _create() {
    this.server = new grpc.Server();
    this.server.addService(Event.Queue, {
      pop: this.pop.bind(this)
    });
  }

  drain() {
    this.server.forceShutdown();
    this._create();
  }

  async listen() {
    await util
      .promisify(this.server.bindAsync)
      .call(
        this.server,
        process.env.FUNCTION_GRPC_ADDRESS,
        grpc.ServerCredentials.createInsecure()
      );
    this.server.start();
  }

  /**
   * ATTENTION: Do not use this method since it is only designed for testing.
   */
  kill(): Promise<void> {
    return util.promisify(this.server.tryShutdown).call(this.server);
  }

  enqueue(event: Event.Event) {
    event.id = uniqid();
    this.queue.set(event.id, event);
    this._enqueueCallback(event);
    if (this._next[0]) {
      this._next.shift()(event);
    }
  }

  dequeue(event: Event.Event) {
    this.queue.delete(event.id);
  }

  async pop(
    call: grpc.ServerUnaryCall<Event.Pop, Event.Event>,
    callback: grpc.sendUnaryData<Event.Event>
  ) {
    let event: Event.Event;

    if (this.size == 0) {
      event = await new Promise(resolve => this._next.push(resolve));
    } else {
      event = this.queue.values().next().value;
    }

    this.queue.delete(event.id);
    this._popCallback(event, call.request.id);
    callback(undefined, event);
  }

  addQueue<T>(queue: Queue<T>) {
    try {
      this.server.addService(queue.TYPE, queue.create() as any);
    } catch (e) {
      console.log(e);
    }
  }
}
