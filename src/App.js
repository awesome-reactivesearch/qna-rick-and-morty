import { AIAnswer, ReactiveBase, SearchBox } from "@appbaseio/reactivesearch";
import { Card, Container, ListGroup, Navbar } from "react-bootstrap";
import Fuse from "fuse.js";

import "bootstrap/dist/css/bootstrap.min.css";

import rickAndMortyImg from "./rick-and-morty.png";
import questions from "./questions.json";

import styles from "./App.module.css";
import { useState } from "react";

const SEARCH_COMPONENT_ID = "SEARCH_COMPONENT";
const AI_ANSWER_COMPONENT_ID = "AI_ANSWER";

function App() {
  const [feedData, setFeedData] = useState({ loading: true, hits: [] });
  return (
    <ReactiveBase
      app="rick-and-morty"
      url="https://2ca5a5864025:12187bc6-44bc-4b3a-9683-80c18cff6312@appbase-demo-ansible-abxiydt-arc.searchbase.io"
      theme={{
        typography: {
          fontFamily: "monospace",
          fontSize: "16px",
        },
        colors: {
          primaryTextColor: "#fff",
          primaryColor: "#06b0c8",
          titleColor: "#424242",
          alertColor: "#d9534f",
        },
      }}
      reactivesearchAPIConfig={{
        recordAnalytics: false,
        userId: "jon",
      }}
      transformRequest={(req) => {
        const body = JSON.parse(req.body);
        body.query = body.query.map((componentQuery) => {
          if (
            componentQuery.id === AI_ANSWER_COMPONENT_ID &&
            componentQuery.type === "search"
          ) {
            return {
              ...componentQuery,
              sortOptions: [{ dataField: "index", sortBy: "asc" }],
            };
          }
          return componentQuery;
        });
        body.settings = {
          recordAnalytics: false,
          backend: "opensearch",
        };
        const newReq = { ...req, body: JSON.stringify(body) };
        return newReq;
      }}
    >
      <div
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${rickAndMortyImg})` }}
      ></div>
      <Navbar bg="white" className="shadow mb-5" expand="lg">
        <Container>
          <Navbar.Brand>Reactivesearch</Navbar.Brand>
          <span className={`text-white ${styles.headingTag}`}>
            Rick and morty
          </span>
          <a href="/">How this is built</a>
        </Container>
      </Navbar>
      <SearchBox
        dataField={["episode_name", "name"]}
        className={`mx-auto mt-2 ${styles.searchboxContainer}`}
        debounce={500}
        componentId={SEARCH_COMPONENT_ID}
        showClear
        highlight={false}
        size={5}
        autosuggest={true}
        onValueSelected={(value) => {
          if (value) window.scrollBy(0, 500);
        }}
        render={({
          downshiftProps: {
            isOpen,
            getItemProps,
            highlightedIndex,
            selectedItem,
          },
          data,
          value: searchQuery,
        }) => {
          const fuse = new Fuse(
            questions.map((q) => ({
              ...q,
              question: q.episode
                ? `${q.question.replace(/\?$/, "")} in "${q.episode}"?`
                : q.question,
            })),
            { keys: ["question"] }
          );
          const filteredData = fuse.search(searchQuery).map((res) => ({
            value: res.item.question,
            episode: res.item.episode,
            idx: res.refIndex,
          }));

          return isOpen ? (
            <div className={`${styles.suggestions}`}>
              <div>
                {filteredData.length ? (
                  <p className={`bg-gray p-2 m-0 ${styles.suggestionHeading}`}>
                    Try below suggestions
                  </p>
                ) : null}
                {filteredData.length ? (
                  <div>
                    {filteredData.map((item, index) =>
                      index < 6 ? (
                        <div
                          /* eslint-disable-next-line react/no-array-index-key */
                          key={item.idx}
                          {...getItemProps({
                            item,
                          })}
                          className={`${
                            highlightedIndex === index
                              ? styles.activeSuggestion
                              : styles.suggestion
                          } 
                                  ${
                                    selectedItem &&
                                    selectedItem.value === item.value
                                      ? styles.selectedSuggestion
                                      : ""
                                  }
                                  `}
                        >
                          <span className="clipText">{item.value}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null;
        }}
      />
      <div id="answer-component" className={`px-5 pt-5 ${styles.answer}`}>
        <AIAnswer
          componentId={AI_ANSWER_COMPONENT_ID}
          showVoiceInput
          showIcon
          react={{ and: SEARCH_COMPONENT_ID }}
          AIConfig={{
            docTemplate: "'${source.name}', says '${source.line}'",
            queryTemplate: "${value}",
            topDocsForContext: 15,
          }}
          enterButton={true}
          showInput={false}
          onData={({ loading, rawData, data }) => {
            if (!loading && data.length) {
              if (rawData.hits && rawData.hits.hits)
                setFeedData({
                  loading: false,
                  hits: rawData.hits.hits.map((hit) => hit._source),
                });
            } else {
              setFeedData({ loading: true, hits: [] });
            }
          }}
        />
      </div>
      <div className="mx-5 my-2">
        <div className="row">
          <ListGroup className={styles.list} variant="flush">
            {!feedData.loading && (
              <>
                <h3 className="bg-white p-2">Dialogues used for answer</h3>
                <div>
                  {feedData.hits.map((item) => (
                    <ListGroup.Item key={item.index} className="py-4 px-2">
                      <h1 className="h5">
                        {item.episode_name} - Season {item["season no."]} -
                        Episode {item["episode no."]}
                      </h1>
                      <div>
                        {item.name} says "{item.line}"
                      </div>
                    </ListGroup.Item>
                  ))}
                </div>
              </>
            )}
          </ListGroup>
        </div>
      </div>
    </ReactiveBase>
  );
}

export default App;
